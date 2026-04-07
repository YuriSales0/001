/**
 * Minimal iCalendar parser — extracts VEVENT entries with start/end dates and summary.
 * Sufficient for Airbnb / Booking.com calendar exports which only emit VEVENT blocks
 * with DTSTART;VALUE=DATE and DTEND;VALUE=DATE.
 */
export type IcalEvent = {
  uid: string
  start: Date
  end: Date
  summary: string
}

function parseDate(value: string): Date {
  // YYYYMMDD or YYYYMMDDTHHMMSSZ
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/)
  if (!m) return new Date(value)
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = m
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s))
}

export function parseIcal(text: string): IcalEvent[] {
  // Unfold lines (RFC 5545: lines starting with space/tab continue previous line)
  const lines = text.replace(/\r\n[ \t]/g, '').split(/\r?\n/)
  const events: IcalEvent[] = []
  let cur: Partial<IcalEvent> | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      cur = {}
      continue
    }
    if (line === 'END:VEVENT') {
      if (cur && cur.start && cur.end) {
        events.push({
          uid: cur.uid || `${cur.start.toISOString()}-${cur.end.toISOString()}`,
          start: cur.start,
          end: cur.end,
          summary: cur.summary || 'Reserved',
        })
      }
      cur = null
      continue
    }
    if (!cur) continue

    const colon = line.indexOf(':')
    if (colon === -1) continue
    const left = line.slice(0, colon)
    const value = line.slice(colon + 1)
    const key = left.split(';')[0]

    if (key === 'UID') cur.uid = value
    else if (key === 'SUMMARY') cur.summary = value
    else if (key === 'DTSTART') cur.start = parseDate(value)
    else if (key === 'DTEND') cur.end = parseDate(value)
  }
  return events
}
