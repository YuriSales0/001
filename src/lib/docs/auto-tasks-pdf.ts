import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Brand colours
const GOLD   = [180, 145, 75]   as const
const BLACK  = [15,  15,  15]   as const
const IVORY  = [250, 247, 240]  as const
const GRAY   = [100, 100, 100]  as const
const LGRAY  = [230, 230, 230]  as const
const WHITE  = [255, 255, 255]  as const
const GREEN  = [22,  163, 74]   as const
const AMBER  = [180, 100, 0]    as const

// ── helpers ──────────────────────────────────────────────────────────────────

function setFill(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
}
function setDraw(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2])
}
function setTextColor(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

// ── main export ──────────────────────────────────────────────────────────────

export function generateAutoTasksPDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  // ── Cover ────────────────────────────────────────────────────────────────

  // Background
  setFill(doc, BLACK)
  doc.rect(0, 0, W, H, 'F')

  // Gold accent bar
  setFill(doc, GOLD)
  doc.rect(0, 0, W, 4, 'F')

  // Logo text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(30)
  setTextColor(doc, GOLD)
  doc.text('HostMasters', W / 2, 45, { align: 'center' })

  // Subtitle
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  setTextColor(doc, [200, 200, 200])
  doc.text('Short-Term Rental Management Platform', W / 2, 55, { align: 'center' })

  // Rule
  setDraw(doc, GOLD)
  doc.setLineWidth(0.5)
  doc.line(30, 64, W - 30, 64)

  // Title block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  setTextColor(doc, WHITE)
  doc.text('Auto-Task System', W / 2, 90, { align: 'center' })

  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  setTextColor(doc, [180, 180, 180])
  doc.text('Operations Documentation', W / 2, 100, { align: 'center' })

  // Date
  const today = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.setFontSize(9)
  setTextColor(doc, GRAY)
  doc.text(today, W / 2, H - 20, { align: 'center' })

  // ── Page 2: Overview ─────────────────────────────────────────────────────

  doc.addPage()
  _header(doc, W, 'Overview')

  let y = 35

  // Intro paragraph
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setTextColor(doc, [50, 50, 50])
  const intro = [
    'When a reservation is created in HostMasters, the platform automatically generates a set of',
    'operational tasks and assigns them to the least-busy crew member. This ensures that every',
    'guest stay is backed by a complete operational workflow — from pre-arrival to post-checkout —',
    'without any manual intervention from the Manager.',
  ]
  intro.forEach(line => {
    doc.text(line, 20, y)
    y += 6
  })

  y += 8

  // How it works box
  setFill(doc, IVORY)
  setDraw(doc, LGRAY)
  doc.setLineWidth(0.3)
  doc.roundedRect(20, y, W - 40, 48, 3, 3, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setTextColor(doc, BLACK)
  doc.text('How it works', 27, y + 8)

  const steps = [
    ['1.', 'A new reservation is created (manually or via OTA sync).'],
    ['2.', 'The system reads the property owner\'s subscription plan.'],
    ['3.', 'The applicable task types are determined for that plan.'],
    ['4.', 'All tasks are created with due dates tied to check-in / check-out.'],
    ['5.', 'Each task is assigned to the crew member with the fewest open tasks (load-balancing).'],
    ['6.', 'If no crew is available, the Admin receives an email alert immediately.'],
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  let sy = y + 16
  steps.forEach(([num, text]) => {
    setTextColor(doc, GOLD)
    doc.setFont('helvetica', 'bold')
    doc.text(num, 27, sy)
    setTextColor(doc, [60, 60, 60])
    doc.setFont('helvetica', 'normal')
    doc.text(text, 34, sy)
    sy += 6.2
  })

  y += 56

  // ── Plan table ───────────────────────────────────────────────────────────

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  setTextColor(doc, BLACK)
  doc.text('Tasks per Subscription Plan', 20, y)
  y += 4

  autoTable(doc, {
    startY: y,
    margin: { left: 20, right: 20 },
    head: [['Task Type', 'STARTER', 'BASIC', 'MID', 'PREMIUM']],
    body: [
      ['Check-in',              '✓', '✓', '✓', '✓'],
      ['Check-out',             '✓', '✓', '✓', '✓'],
      ['Cleaning',              '✓', '✓', '✓', '✓'],
      ['Inspection (pre+post)', '—', '✓', '✓', '✓'],
      ['Shopping',              '—', '—', '—', '✓'],
      ['Transfer',              '—', '—', '—', '✓'],
      ['Laundry',               '—', '—', '—', '✓'],
    ],
    headStyles: {
      fillColor: [BLACK[0], BLACK[1], BLACK[2]],
      textColor: [GOLD[0], GOLD[1], GOLD[2]],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 60 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 24 },
    },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index > 0) {
        if (data.cell.raw === '✓') {
          data.cell.styles.textColor = [GREEN[0], GREEN[1], GREEN[2]]
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = [170, 170, 170]
        }
      }
      if (data.column.index === 4 && data.section === 'head') {
        data.cell.styles.fillColor = [AMBER[0], AMBER[1], AMBER[2]]
        data.cell.styles.textColor = [255, 255, 255]
      }
    },
  })

  // Note about due dates
  const afterTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 180
  y = afterTable + 8

  setFill(doc, [255, 251, 235])
  setDraw(doc, [253, 224, 71])
  doc.setLineWidth(0.3)
  doc.roundedRect(20, y, W - 40, 22, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setTextColor(doc, [120, 80, 0])
  doc.text('Due date rules', 26, y + 7)
  doc.setFont('helvetica', 'normal')
  setTextColor(doc, [100, 70, 0])
  doc.text('Check-in · Transfer · Shopping → due on check-in date', 26, y + 13.5)
  doc.text('Check-out · Cleaning · Inspection (post) · Laundry → due on check-out date', 26, y + 19)
  doc.setFont('helvetica', 'italic')
  doc.text('Inspection (pre) · Shopping → due 1 day before check-in', W - 20, y + 13.5, { align: 'right' })

  _footer(doc, W, H, 2)

  // ── Page 3: Checklists ───────────────────────────────────────────────────

  doc.addPage()
  _header(doc, W, 'Task Checklists')

  const checklists: [string, string, string[]][] = [
    ['CHECK-IN', 'sky', [
      'Contact guest 2h before arrival',
      'Verify cleanliness of entry areas',
      'Hand over keys or confirm smart lock code',
      'Walkthrough: WiFi, appliances, amenities',
      'Collect guest ID and registration',
      'Explain house rules and emergency contacts',
      'Confirm number of guests matches reservation',
    ]],
    ['CHECK-OUT', 'orange', [
      'Collect keys / confirm smart lock deactivated',
      'Inspect overall condition of the property',
      'Check for damage (photographic evidence)',
      'Verify inventory (towels, linen, kitchen)',
      'Close doors, windows and outdoor areas',
      'Report any issues to admin immediately',
    ]],
    ['CLEANING', 'blue', [
      'Strip linen and start laundry',
      'Clean and disinfect bathrooms',
      'Kitchen: dishes, counters, appliances, fridge',
      'Vacuum and mop all rooms',
      'Restock amenities (toiletries, coffee, paper)',
      'Fresh towels and bed linen',
      'Rubbish, check exterior',
      'Final walkthrough and photos',
    ]],
    ['INSPECTION', 'violet', [
      'Full walkthrough with checklist',
      'Photograph each room',
      'Note wear and problems',
      'Verify safety equipment',
      'Report findings to admin',
    ]],
    ['MAINTENANCE — PREVENTIVE', 'green', [
      'Test smoke and CO detectors',
      'Check filters and HVAC operation',
      'Inspect plumbing for leaks',
      'Test all light fixtures',
      'Check door and window locks',
      'Test WiFi speed and reboot router',
      'Inspect outdoor areas and drainage',
      'Test appliances (AC, heater, boiler)',
    ]],
    ['MAINTENANCE — CORRECTIVE', 'red', [
      'Document reported issue with photos',
      'Identify root cause',
      'Execute repair or contact specialist',
      'Test solution thoroughly',
      'Document result with photos',
      'Notify admin and client when resolved',
      'Issue invoice if cost > €50',
    ]],
  ]

  y = 32
  const COL = 2
  const CARD_W = (W - 50) / COL
  const CARD_PAD = 5

  const COLOR_MAP: Record<string, [number, number, number][]> = {
    sky:    [[224, 242, 254], [3, 105, 161]],
    orange: [[255, 237, 213], [154, 52, 18]],
    blue:   [[219, 234, 254], [29, 78, 216]],
    violet: [[237, 233, 254], [109, 40, 217]],
    green:  [[220, 252, 231], [21, 128, 61]],
    red:    [[254, 226, 226], [185, 28, 28]],
  }

  checklists.forEach(([ title, color, items ], idx) => {
    const col = idx % COL
    const row = Math.floor(idx / COL)

    if (row === 1 && col === 0) y += 62  // second row
    if (row === 2 && col === 0) y += 62  // third row

    const x = 20 + col * (CARD_W + 10)
    const [bg, accent] = COLOR_MAP[color]

    setFill(doc, bg)
    doc.roundedRect(x, y, CARD_W, 56, 3, 3, 'F')

    // Accent top strip
    setFill(doc, accent)
    doc.roundedRect(x, y, CARD_W, 8, 3, 3, 'F')
    doc.rect(x, y + 5, CARD_W, 3, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    setTextColor(doc, WHITE)
    doc.text(title, x + CARD_PAD, y + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setTextColor(doc, [30, 30, 30])
    let iy = y + 14
    items.forEach(item => {
      // bullet
      setFill(doc, accent)
      doc.circle(x + CARD_PAD + 1, iy - 1.2, 0.8, 'F')
      doc.text(item, x + CARD_PAD + 4, iy)
      iy += 5.2
    })
  })

  _footer(doc, W, H, 3)

  // ── Page 4: Checklists 2 + Crew assignment ───────────────────────────────

  doc.addPage()
  _header(doc, W, 'Task Checklists (cont.) & Crew Assignment')

  const checklists2: [string, string, string[]][] = [
    ['TRANSFER', 'cyan', [
      'Confirm flight/arrival with guest',
      'Verify arrival time and terminal',
      'Prepare name sign for guest',
      'Assist with luggage',
      'Inform estimated travel time to property',
      'Hand over keys / introduce property on arrival',
    ]],
    ['SHOPPING', 'pink', [
      'Confirm shopping list with owner',
      'Check guest dietary restrictions',
      'Purchase essentials (milk, coffee, water, bread)',
      'Purchase any specific requested items',
      'Place shopping in fridge/pantry',
      'Leave welcome note listing available items',
    ]],
    ['LAUNDRY', 'indigo', [
      'Collect all bed linen and towels',
      'Separate by colour and fabric type',
      'Wash at 60°C (linen) and 40°C (towels)',
      'Dry and fold correctly',
      'Replace in property with premium presentation',
      'Check condition — report damaged items',
    ]],
  ]

  y = 32

  checklists2.forEach(([title, color, items], idx) => {
    const col = idx % COL
    const x = 20 + col * (CARD_W + 10)

    const colorMap2: Record<string, [number, number, number][]> = {
      cyan:   [[207, 250, 254], [14, 116, 144]],
      pink:   [[252, 231, 243], [157, 23, 77]],
      indigo: [[224, 231, 255], [67, 56, 202]],
    }
    const [bg, accent] = colorMap2[color]

    setFill(doc, bg)
    doc.roundedRect(x, y, CARD_W, 56, 3, 3, 'F')
    setFill(doc, accent)
    doc.roundedRect(x, y, CARD_W, 8, 3, 3, 'F')
    doc.rect(x, y + 5, CARD_W, 3, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    setTextColor(doc, WHITE)
    doc.text(title, x + CARD_PAD, y + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setTextColor(doc, [30, 30, 30])
    let iy = y + 14
    items.forEach(item => {
      setFill(doc, accent)
      doc.circle(x + CARD_PAD + 1, iy - 1.2, 0.8, 'F')
      doc.text(item, x + CARD_PAD + 4, iy)
      iy += 5.2
    })
  })

  y += 66

  // Crew assignment section
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  setTextColor(doc, BLACK)
  doc.text('Crew Assignment Algorithm', 20, y)
  y += 6

  setFill(doc, IVORY)
  setDraw(doc, LGRAY)
  doc.setLineWidth(0.3)
  doc.roundedRect(20, y, W - 40, 52, 3, 3, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  setTextColor(doc, [60, 60, 60])

  const crewText = [
    'When generating auto-tasks for a new reservation, HostMasters uses a load-balancing',
    'algorithm to distribute work evenly across available crew members:',
  ]
  let cy = y + 8
  crewText.forEach(line => {
    doc.text(line, 27, cy)
    cy += 6
  })

  cy += 3
  const crewSteps = [
    ['1.', 'All CREW users are fetched from the database.'],
    ['2.', 'Each crew\'s count of non-completed tasks is calculated.'],
    ['3.', 'The crew member with the fewest open tasks is selected.'],
    ['4.', 'All auto-generated tasks for the reservation are assigned to that crew.'],
    ['5.', 'If NO crew member exists, all tasks are created as Unassigned and the Admin receives an email alert.'],
  ]

  crewSteps.forEach(([num, text]) => {
    setTextColor(doc, GOLD)
    doc.setFont('helvetica', 'bold')
    doc.text(num, 27, cy)
    setTextColor(doc, [60, 60, 60])
    doc.setFont('helvetica', 'normal')
    doc.text(text, 35, cy, { maxWidth: W - 65 })
    cy += 6.2
  })

  y += 60

  // Manual assignment note
  setFill(doc, [240, 253, 244])
  setDraw(doc, [134, 239, 172])
  doc.setLineWidth(0.3)
  doc.roundedRect(20, y, W - 40, 24, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setTextColor(doc, [21, 128, 61])
  doc.text('Manual override', 27, y + 8)
  doc.setFont('helvetica', 'normal')
  setTextColor(doc, [30, 100, 50])
  doc.text(
    'Managers can override auto-assignment at any time by editing a task and selecting a specific',
    27, y + 14.5
  )
  doc.text(
    'crew member from the dropdown. Auto-assignment is also bypassed when creating tasks manually.',
    27, y + 20
  )

  _footer(doc, W, H, 4)

  // ── Page 5: Role responsibilities ────────────────────────────────────────

  doc.addPage()
  _header(doc, W, 'Role Responsibilities')

  const roles = [
    {
      role: 'ADMIN',
      color: [BLACK, GOLD] as [[number,number,number],[number,number,number]],
      responsibilities: [
        'Full visibility and control over all properties, reservations and tasks.',
        'Receives alerts when no crew is available for auto-assignment.',
        'Can create, edit and delete any task, property or user.',
        'Monitors operational KPIs and financial performance.',
        'Manages subscription plans which determine auto-task scope.',
      ],
    },
    {
      role: 'MANAGER',
      color: [[30,58,138], [147,197,253]] as [[number,number,number],[number,number,number]],
      responsibilities: [
        'Sees tasks and properties scoped to their assigned clients.',
        'Dispatches manual tasks and monitors field operations.',
        'Creates reservations that trigger the auto-task pipeline.',
        'Advances task status (Pending → In Progress → Completed).',
        'Filtered crew view: only sees crew assigned to their scope.',
      ],
    },
    {
      role: 'CREW',
      color: [[20,83,45], [134,239,172]] as [[number,number,number],[number,number,number]],
      responsibilities: [
        'Receives only tasks assigned to them (filtered API).',
        'Starts tasks and works through the checklist item by item.',
        'Submits a structured check-out report (condition, issues, damages).',
        'Marking a task as Complete triggers an email to the property owner.',
        'Field work is guided by professional per-type checklists.',
      ],
    },
    {
      role: 'CLIENT',
      color: [[120,53,15], [253,186,116]] as [[number,number,number],[number,number,number]],
      responsibilities: [
        'Sees upcoming visits and task history for their property.',
        'Receives email notification when a visit is completed.',
        'Views parsed check-out reports: condition, issues, damages.',
        'Can request corrective maintenance or inspections directly.',
        'Dashboard shows a Care Snapshot with flagged issues.',
      ],
    },
  ]

  y = 32
  roles.forEach(({ role, color, responsibilities }) => {
    const [bg, accent] = color

    setFill(doc, bg)
    doc.roundedRect(20, y, W - 40, 48, 3, 3, 'F')

    // Role tag
    setFill(doc, accent)
    doc.roundedRect(25, y + 6, 24, 7, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    setTextColor(doc, bg)
    doc.text(role, 37, y + 11, { align: 'center' })

    // Responsibilities
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    setTextColor(doc, WHITE)
    let ry = y + 7
    responsibilities.forEach(line => {
      setFill(doc, accent)
      doc.circle(55, ry - 1, 0.8, 'F')
      doc.text(line, 59, ry)
      ry += 6
    })

    y += 55
  })

  _footer(doc, W, H, 5)

  // ── Save ─────────────────────────────────────────────────────────────────

  doc.save('HostMasters_Auto-Task_System.pdf')
}

// ── private helpers ───────────────────────────────────────────────────────────

function _header(doc: jsPDF, W: number, title: string) {
  setFill(doc, BLACK)
  doc.rect(0, 0, W, 18, 'F')

  setFill(doc, GOLD)
  doc.rect(0, 0, W, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setTextColor(doc, GOLD)
  doc.text('HostMasters', 20, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setTextColor(doc, [180, 180, 180])
  doc.text(title, W - 20, 12, { align: 'right' })
}

function _footer(doc: jsPDF, W: number, H: number, page: number) {
  setDraw(doc, LGRAY)
  doc.setLineWidth(0.2)
  doc.line(20, H - 12, W - 20, H - 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  setTextColor(doc, [150, 150, 150])
  doc.text('HostMasters · Auto-Task System Documentation · Confidential', 20, H - 7)
  doc.text(`Page ${page}`, W - 20, H - 7, { align: 'right' })
}
