"use client";

import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { generateMonthlyReportPDF } from "@/lib/pdf";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const mockReport = {
  month: "March",
  year: 2026,
  grossRevenue: 5250,
  reservations: [
    { guest: "Pierre Dupont", checkIn: "Mar 15", checkOut: "Mar 22", amount: 1750, platform: "Airbnb" },
    { guest: "Maria Garcia", checkIn: "Mar 1", checkOut: "Mar 8", amount: 1600, platform: "Booking.com" },
    { guest: "John Smith", checkIn: "Mar 24", checkOut: "Mar 30", amount: 1900, platform: "Direct" },
  ],
  expenses: [
    { description: "Cleaning - Dupont checkout", amount: 85, category: "Cleaning" },
    { description: "Cleaning - Garcia checkout", amount: 85, category: "Cleaning" },
    { description: "Cleaning - Smith checkout", amount: 85, category: "Cleaning" },
    { description: "Pool maintenance", amount: 120, category: "Maintenance" },
    { description: "Garden service", amount: 90, category: "Maintenance" },
    { description: "WiFi subscription", amount: 35, category: "Utilities" },
  ],
  totalExpenses: 500,
  commissionRate: 18,
};

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(2); // March

  const commission = mockReport.grossRevenue * (mockReport.commissionRate / 100);
  const ownerPayout = mockReport.grossRevenue - mockReport.totalExpenses - commission;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy-900">Financial Reports</h1>
        <Button
          className="gap-2 bg-navy-900 hover:bg-navy-800"
          onClick={() => {
            const doc = generateMonthlyReportPDF({
              propertyName: "Villa Sunshine",
              ownerName: "Thomas Weber",
              month: mockReport.month,
              year: mockReport.year,
              reservations: mockReport.reservations,
              expenses: mockReport.expenses,
              grossRevenue: mockReport.grossRevenue,
              totalExpenses: mockReport.totalExpenses,
              commissionRate: mockReport.commissionRate,
              commission,
              ownerPayout,
            });
            doc.save(`Hostmaster-Report-${mockReport.month}-${mockReport.year}.pdf`);
          }}
        >
          <Download className="h-4 w-4" /> Download PDF
        </Button>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {months.map((m, i) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedMonth === i
                ? "bg-navy-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Gross Revenue</p>
            <p className="text-2xl font-bold text-navy-900">{formatCurrency(mockReport.grossRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(mockReport.totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Commission ({mockReport.commissionRate}%)</p>
            <p className="text-2xl font-bold text-gray-600">{formatCurrency(commission)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-navy-900">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-300">Your Payout</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(ownerPayout)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Reservations Breakdown */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-navy-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gold-400" /> Income — {mockReport.month} {mockReport.year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-gray-500">Guest</th>
                <th className="pb-3 font-medium text-gray-500">Dates</th>
                <th className="pb-3 font-medium text-gray-500">Platform</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {mockReport.reservations.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-3 font-medium text-navy-900">{r.guest}</td>
                  <td className="py-3 text-gray-600">{r.checkIn} — {r.checkOut}</td>
                  <td className="py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{r.platform}</span>
                  </td>
                  <td className="py-3 text-right font-medium text-green-600">{formatCurrency(r.amount)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="pt-3" colSpan={3}>Total Income</td>
                <td className="pt-3 text-right">{formatCurrency(mockReport.grossRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Expenses Breakdown */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-navy-900">Expenses — {mockReport.month} {mockReport.year}</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-gray-500">Description</th>
                <th className="pb-3 font-medium text-gray-500">Category</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {mockReport.expenses.map((e, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-3 text-navy-900">{e.description}</td>
                  <td className="py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{e.category}</span>
                  </td>
                  <td className="py-3 text-right text-red-600">{formatCurrency(e.amount)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="pt-3" colSpan={2}>Total Expenses</td>
                <td className="pt-3 text-right text-red-600">{formatCurrency(mockReport.totalExpenses)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Final Summary */}
      <Card className="border-0 shadow-sm bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Gross Revenue</span>
              <span className="font-medium">{formatCurrency(mockReport.grossRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expenses</span>
              <span className="font-medium text-red-600">-{formatCurrency(mockReport.totalExpenses)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Management Commission ({mockReport.commissionRate}%)</span>
              <span className="font-medium text-red-600">-{formatCurrency(commission)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-base">
              <span className="font-bold text-navy-900">Owner Payout</span>
              <span className="font-bold text-navy-900">{formatCurrency(ownerPayout)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
