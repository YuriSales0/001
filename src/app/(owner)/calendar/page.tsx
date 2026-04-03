"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const mockReservations = [
  { id: "1", guest: "Hans Mueller", checkIn: new Date(2026, 3, 10), checkOut: new Date(2026, 3, 17), color: "bg-blue-200 text-blue-800" },
  { id: "2", guest: "Anna Svensson", checkIn: new Date(2026, 3, 20), checkOut: new Date(2026, 3, 27), color: "bg-green-200 text-green-800" },
  { id: "3", guest: "Pierre Dupont", checkIn: new Date(2026, 4, 5), checkOut: new Date(2026, 4, 12), color: "bg-blue-200 text-blue-800" },
];

const mockBlocked = [
  { id: "b1", startDate: new Date(2026, 3, 1), endDate: new Date(2026, 3, 5), reason: "Personal use" },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday=0
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(3); // April
  const [currentYear, setCurrentYear] = useState(2026);
  const [blockOpen, setBlockOpen] = useState(false);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prev = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const next = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const getDateStatus = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    for (const r of mockReservations) {
      if (date >= r.checkIn && date < r.checkOut) {
        return { type: "reservation", label: r.guest, color: r.color };
      }
    }
    for (const b of mockBlocked) {
      if (date >= b.startDate && date <= b.endDate) {
        return { type: "blocked", label: "Blocked", color: "bg-gray-200 text-gray-600" };
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy-900">Booking Calendar</h1>
        <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-navy-900 hover:bg-navy-800">
              <Lock className="h-4 w-4" /> Block Dates
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Block Dates for Personal Use</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Input placeholder="Personal use, family visit..." />
              </div>
              <Button className="w-full bg-navy-900 hover:bg-navy-800" onClick={() => setBlockOpen(false)}>
                Block Dates
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prev}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-navy-900">
              {MONTHS[currentMonth]} {currentYear}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={next}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
            {DAYS.map((d) => (
              <div key={d} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white p-2 min-h-[80px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const status = getDateStatus(day);
              const isToday = day === 1 && currentMonth === 3 && currentYear === 2026;
              return (
                <div key={day} className="bg-white p-2 min-h-[80px] border-t">
                  <span className={`text-sm ${isToday ? "bg-navy-900 text-white rounded-full w-6 h-6 flex items-center justify-center" : "text-gray-700"}`}>
                    {day}
                  </span>
                  {status && (
                    <div className={`mt-1 text-xs px-1.5 py-0.5 rounded truncate ${status.color}`}>
                      {status.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-200" /> Confirmed booking
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-200" /> Upcoming booking
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-200" /> Blocked dates
        </div>
      </div>
    </div>
  );
}
