"use client"

import { useState } from "react"
import {
  FileBarChart,
  Download,
  Eye,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

interface Report {
  id: string
  property: string
  month: string
  year: number
  generatedAt: string
  revenue: number
  expenses: number
  occupancy: number
  reservations: number
  status: "ready" | "generating"
}

const mockReports: Report[] = [
  {
    id: "RPT001",
    property: "Villa Mar Azul",
    month: "March",
    year: 2026,
    generatedAt: "2026-04-01",
    revenue: 5250,
    expenses: 620,
    occupancy: 77,
    reservations: 4,
    status: "ready",
  },
  {
    id: "RPT002",
    property: "Casa Tropical",
    month: "March",
    year: 2026,
    generatedAt: "2026-04-01",
    revenue: 7100,
    expenses: 830,
    occupancy: 90,
    reservations: 5,
    status: "ready",
  },
  {
    id: "RPT003",
    property: "Penthouse Sunset",
    month: "February",
    year: 2026,
    generatedAt: "2026-03-01",
    revenue: 9800,
    expenses: 1150,
    occupancy: 86,
    reservations: 4,
    status: "ready",
  },
  {
    id: "RPT004",
    property: "Villa Mar Azul",
    month: "February",
    year: 2026,
    generatedAt: "2026-03-01",
    revenue: 5800,
    expenses: 650,
    occupancy: 89,
    reservations: 5,
    status: "ready",
  },
]

const properties = [
  "Villa Mar Azul",
  "Casa Tropical",
  "Penthouse Sunset",
  "Studio Playa Blanca",
  "Apartamento Oceano",
]

const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

const yearOptions = ["2024", "2025", "2026"]

export default function ReportsPage() {
  const [selectedProperty, setSelectedProperty] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState("2026")
  const [previewReport, setPreviewReport] = useState<Report | null>(null)

  function handleGenerate() {
    // In a real app this would trigger an API call
    alert(
      `Generating report for ${selectedProperty} - ${
        monthOptions.find((m) => m.value === selectedMonth)?.label
      } ${selectedYear}`
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate and download property performance reports
        </p>
      </div>

      {/* Generate Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generate New Report</CardTitle>
          <CardDescription>
            Select a property and time period to generate a report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="grid gap-2 flex-1">
              <Label>Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 w-[160px]">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 w-[120px]">
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!selectedProperty || !selectedMonth}
            >
              <FileBarChart className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Report List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-lg">Previous Reports</h2>
          <div className="space-y-3">
            {mockReports.map((report) => (
              <Card
                key={report.id}
                className={cn(
                  "transition-shadow hover:shadow-md cursor-pointer",
                  previewReport?.id === report.id && "ring-2 ring-primary"
                )}
                onClick={() => setPreviewReport(report)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileBarChart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{report.property}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.month} {report.year}
                      </span>
                      <span>Generated: {formatDate(report.generatedAt)}</span>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      report.status === "ready"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    )}
                  >
                    {report.status === "ready" ? "Ready" : "Generating"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewReport(report)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Preview Card */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Report Preview</h2>
          {previewReport ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {previewReport.property}
                </CardTitle>
                <CardDescription>
                  {previewReport.month} {previewReport.year}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold text-emerald-700">
                      {formatCurrency(previewReport.revenue)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Expenses</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(previewReport.expenses)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Occupancy</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold">{previewReport.occupancy}%</p>
                      <div className="h-2 flex-1 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${previewReport.occupancy}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Reservations</p>
                    <p className="text-lg font-bold">
                      {previewReport.reservations}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Net Income</span>
                    <span className="font-semibold">
                      {formatCurrency(previewReport.revenue - previewReport.expenses)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Profit Margin</span>
                    <span className="font-semibold">
                      {Math.round(
                        ((previewReport.revenue - previewReport.expenses) /
                          previewReport.revenue) *
                          100
                      )}
                      %
                    </span>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <FileBarChart className="mb-3 h-10 w-10" />
                <p className="text-sm">
                  Select a report from the list to preview its summary.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
