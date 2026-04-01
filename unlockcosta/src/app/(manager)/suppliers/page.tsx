"use client"

import { useState } from "react"
import {
  Plus,
  Phone,
  Mail,
  Building2,
  Search,
  Pencil,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type SupplierType = "cleaner" | "plumber" | "electrician" | "general"

interface Supplier {
  id: string
  name: string
  type: SupplierType
  phone: string
  email: string
  propertiesCount: number
  notes: string
}

const mockSuppliers: Supplier[] = [
  {
    id: "S001",
    name: "Maria Cleaning Co.",
    type: "cleaner",
    phone: "+506 8812-3456",
    email: "maria@cleaningcr.com",
    propertiesCount: 4,
    notes: "Reliable, available on weekends",
  },
  {
    id: "S002",
    name: "Pedro Plumbing",
    type: "plumber",
    phone: "+506 8834-7890",
    email: "pedro@plumbingcr.com",
    propertiesCount: 3,
    notes: "Emergency calls available 24/7",
  },
  {
    id: "S003",
    name: "TechCool Services",
    type: "electrician",
    phone: "+506 8856-1234",
    email: "info@techcool.cr",
    propertiesCount: 5,
    notes: "Specialized in AC and electrical systems",
  },
  {
    id: "S004",
    name: "Costa HandyPro",
    type: "general",
    phone: "+506 8878-5678",
    email: "hello@costahandypro.com",
    propertiesCount: 2,
    notes: "General maintenance and repairs",
  },
  {
    id: "S005",
    name: "Sparkle Cleaners",
    type: "cleaner",
    phone: "+506 8890-9012",
    email: "team@sparklecr.com",
    propertiesCount: 3,
    notes: "Eco-friendly products, premium service",
  },
]

const typeColors: Record<SupplierType, string> = {
  cleaner: "bg-sky-100 text-sky-800 border-sky-200",
  plumber: "bg-blue-100 text-blue-800 border-blue-200",
  electrician: "bg-amber-100 text-amber-800 border-amber-200",
  general: "bg-gray-100 text-gray-800 border-gray-200",
}

export default function SuppliersPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterType, setFilterType] = useState("all")
  const [search, setSearch] = useState("")

  const filtered = mockSuppliers.filter((s) => {
    const matchesType = filterType === "all" || s.type === filterType
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your vendor and supplier directory
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Supplier</DialogTitle>
              <DialogDescription>
                Add a new supplier to your directory.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="supplier-name">Name</Label>
                <Input id="supplier-name" placeholder="Company or individual name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier-type">Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaner">Cleaner</SelectItem>
                    <SelectItem value="plumber">Plumber</SelectItem>
                    <SelectItem value="electrician">Electrician</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="supplier-phone">Phone</Label>
                  <Input id="supplier-phone" placeholder="+506 xxxx-xxxx" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supplier-email">Email</Label>
                  <Input id="supplier-email" type="email" placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier-notes">Notes</Label>
                <Input id="supplier-notes" placeholder="Any relevant notes" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setDialogOpen(false)}>Add Supplier</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="cleaner">Cleaner</SelectItem>
            <SelectItem value="plumber">Plumber</SelectItem>
            <SelectItem value="electrician">Electrician</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Properties
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-b transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {supplier.notes}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn("capitalize", typeColors[supplier.type])}
                      >
                        {supplier.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {supplier.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {supplier.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{supplier.propertiesCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No suppliers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
