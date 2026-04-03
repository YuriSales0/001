"use client"

import { useState } from "react"
import {
  DollarSign,
  TrendingUp,
  Percent,
  BarChart3,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn, formatCurrency, calculateOwnerPayout, getOccupancyRate, calculateADR, calculateRevPAR } from "@/lib/utils"

interface PropertyRevenue {
  property: string
  revenue: number
  expenses: number
  commissionRate: number
  bookedNights: number
  totalNights: number
}

const months = [
  { value: "2026-01", label: "January 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-03", label: "March 2026" },
  { value: "2026-04", label: "April 2026" },
]

const mockData: Record<string, PropertyRevenue[]> = {
  "2026-03": [
    {
      property: "Villa Mar Azul",
      revenue: 5250,
      expenses: 620,
      commissionRate: 18,
      bookedNights: 24,
      totalNights: 31,
    },
    {
      property: "Casa Tropical",
      revenue: 7100,
      expenses: 830,
      commissionRate: 18,
      bookedNights: 28,
      totalNights: 31,
    },
    {
      property: "Penthouse Sunset",
      revenue: 9400,
      expenses: 1100,
      commissionRate: 15,
      bookedNights: 22,
      totalNights: 31,
    },
    {
      property: "Studio Playa Blanca",
      revenue: 2800,
      expenses: 310,
      commissionRate: 18,
      bookedNights: 20,
      totalNights: 31,
    },
  ],
  "2026-04": [
    {
      property: "Villa Mar Azul",
      revenue: 4800,
      expenses: 580,
      commissionRate: 18,
      bookedNights: 20,
      totalNights: 30,
    },
    {
      property: "Casa Tropical",
      revenue: 6500,
      expenses: 750,
      commissionRate: 18,
      bookedNights: 25,
      totalNights: 30,
    },
    {
      property: "Penthouse Sunset",
      revenue: 8200,
      expenses: 950,
      commissionRate: 15,
      bookedNights: 18,
      totalNights: 30,
    },
    {
      property: "Studio Playa Blanca",
      revenue: 2400,
      expenses: 280,
      commissionRate: 18,
      bookedNights: 16,
      totalNights: 30,
    },
  ],
}

// Also provide data for Jan/Feb
mockData["2026-01"] = [
  {
    property: "Villa Mar Azul",
    revenue: 6100,
    expenses: 700,
    commissionRate: 18,
    bookedNights: 27,
    totalNights: 31,
  },
  {
    property: "Casa Tropical",
    revenue: 8200,
    expenses: 900,
    commissionRate: 18,
    bookedNights: 30,
    totalNights: 31,
  },
  {
    property: "Penthouse Sunset",
    revenue: 10500,
    expenses: 1200,
    commissionRate: 15,
    bookedNights: 26,
    totalNights: 31,
  },
  {
    property: "Studio Playa Blanca",
    revenue: 3100,
    expenses: 350,
    commissionRate: 18,
    bookedNights: 22,
    totalNights: 31,
  },
]
mockData["2026-02"] = [
  {
    property: "Villa Mar Azul",
    revenue: 5800,
    expenses: 650,
    commissionRate: 18,
    bookedNights: 25,
    totalNights: 28,
  },
  {
    property: "Casa Tropical",
    revenue: 7500,
    expenses: 860,
    commissionRate: 18,
    bookedNights: 26,
    totalNights: 28,
  },
  {
    property: "Penthouse Sunset",
    revenue: 9800,
    expenses: 1150,
    commissionRate: 15,
    bookedNights: 24,
    totalNights: 28,
  },
  {
    property: "Studio Playa Blanca",
    revenue: 2900,
    expenses: 330,
    commissionRate: 18,
    bookedNights: 21,
    totalNights: 28,
  },
]

export default function RevenuePage() {
  const [selectedMonth, setSelectedMonth] = useState("2026-03")

  const data = mockData[selectedMonth] ?? []

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0)
  const totalBookedNights = data.reduce((s, d) => s + d.bookedNights, 0)
  const totalNights = data.reduce((s, d) => s + d.totalNights, 0)

  const avgADR = calculateADR(totalRevenue, totalBookedNights)
  const occupancyRate = getOccupancyRate(totalBookedNights, totalNights)
  const revPAR = calculateRevPAR(totalRevenue, totalNights)

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Avg ADR",
      value: formatCurrency(avgADR),
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Occupancy Rate",
      value: `${occupancyRate}%`,
      icon: Percent,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "RevPAR",
      value: formatCurrency(revPAR),
      icon: BarChart3,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
          <p className="text-sm text-muted-foreground">
            Financial overview and property performance
          </p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    stat.bg
                  )}
                >
                  <Icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Revenue by Property Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue by Property</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Property
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Expenses
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Commission
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Payout
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Occupancy
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => {
                  const { commission, payout } = calculateOwnerPayout(
                    row.revenue,
                    row.expenses,
                    row.commissionRate
                  )
                  const occ = getOccupancyRate(row.bookedNights, row.totalNights)
                  return (
                    <tr
                      key={row.property}
                      className="border-b transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-medium">{row.property}</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(row.revenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatCurrency(row.expenses)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatCurrency(commission)}
                        <span className="ml-1 text-xs">({row.commissionRate}%)</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                        {formatCurrency(payout)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-emerald-500"
                              style={{ width: `${occ}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{occ}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 font-semibold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(totalRevenue)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(totalExpenses)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(
                      data.reduce(
                        (s, d) =>
                          s + calculateOwnerPayout(d.revenue, d.expenses, d.commissionRate).commission,
                        0
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700">
                    {formatCurrency(
                      data.reduce(
                        (s, d) =>
                          s + calculateOwnerPayout(d.revenue, d.expenses, d.commissionRate).payout,
                        0
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {occupancyRate}% avg
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
