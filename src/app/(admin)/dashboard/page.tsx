"use client";

import {
  Euro,
  CalendarDays,
  ClipboardCheck,
  TrendingUp,
  MessageCircle,
  Lock,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

const mockBookings = [
  { id: "1", guest: "Hans Mueller", checkIn: "2026-04-10", checkOut: "2026-04-17", amount: 1890, status: "UPCOMING" },
  { id: "2", guest: "Anna Svensson", checkIn: "2026-04-20", checkOut: "2026-04-27", amount: 2100, status: "UPCOMING" },
  { id: "3", guest: "Pierre Dupont", checkIn: "2026-03-15", checkOut: "2026-03-22", amount: 1750, status: "COMPLETED" },
  { id: "4", guest: "Maria Garcia", checkIn: "2026-03-01", checkOut: "2026-03-08", amount: 1600, status: "COMPLETED" },
];

const statusColor: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
};

export default function OwnerDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Welcome back, Thomas</h1>
        <p className="text-gray-500 mt-1">Here&apos;s how your property is performing</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Monthly Earnings</p>
                <p className="text-2xl font-bold text-navy-900 mt-1">{formatCurrency(3890)}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +12% vs last month
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gold-50 flex items-center justify-center">
                <Euro className="h-6 w-6 text-gold-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Next Booking</p>
                <p className="text-lg font-bold text-navy-900 mt-1">Hans Mueller</p>
                <p className="text-xs text-gray-500 mt-1">Apr 10 - Apr 17</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Last Inspection</p>
                <p className="text-lg font-bold text-navy-900 mt-1">Mar 22, 2026</p>
                <p className="text-xs text-green-600 mt-1">All clear</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                <ClipboardCheck className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Occupancy Rate</p>
                <p className="text-2xl font-bold text-navy-900 mt-1">78%</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Above avg
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/calendar">
          <Button variant="outline" className="gap-2">
            <Lock className="h-4 w-4" /> Block Dates
          </Button>
        </Link>
        <Link href="/my-reports">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" /> View Reports
          </Button>
        </Link>
        <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <MessageCircle className="h-4 w-4" /> Contact Your Manager
        </Button>
      </div>

      {/* Recent Bookings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-navy-900">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-gray-500">Guest</th>
                  <th className="pb-3 font-medium text-gray-500">Check-in</th>
                  <th className="pb-3 font-medium text-gray-500">Check-out</th>
                  <th className="pb-3 font-medium text-gray-500">Amount</th>
                  <th className="pb-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockBookings.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-3 font-medium text-navy-900">{b.guest}</td>
                    <td className="py-3 text-gray-600">{formatDate(b.checkIn)}</td>
                    <td className="py-3 text-gray-600">{formatDate(b.checkOut)}</td>
                    <td className="py-3 font-medium">{formatCurrency(b.amount)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
