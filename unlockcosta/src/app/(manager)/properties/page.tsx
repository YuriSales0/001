"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Building2,
  Plus,
  Search,
  Eye,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type PropertyStatus = "active" | "inactive" | "maintenance"

interface Property {
  id: string
  name: string
  address: string
  owner: string
  status: PropertyStatus
  occupancy: number
  bedrooms: number
  bathrooms: number
}

const mockProperties: Property[] = [
  {
    id: "1",
    name: "Villa Mar Azul",
    address: "Calle del Sol 12, Tamarindo",
    owner: "Carlos Mendez",
    status: "active",
    occupancy: 78,
    bedrooms: 3,
    bathrooms: 2,
  },
  {
    id: "2",
    name: "Casa Tropical",
    address: "Avenida Playa 45, Manuel Antonio",
    owner: "Sofia Ramirez",
    status: "active",
    occupancy: 92,
    bedrooms: 4,
    bathrooms: 3,
  },
  {
    id: "3",
    name: "Apartamento Oceano",
    address: "Calle Marina 8, Jacó",
    owner: "Diego Vargas",
    status: "maintenance",
    occupancy: 0,
    bedrooms: 2,
    bathrooms: 1,
  },
  {
    id: "4",
    name: "Penthouse Sunset",
    address: "Boulevard Pacífico 3, Flamingo",
    owner: "Maria Lopez",
    status: "active",
    occupancy: 65,
    bedrooms: 5,
    bathrooms: 4,
  },
  {
    id: "5",
    name: "Studio Playa Blanca",
    address: "Calle Coral 21, Santa Teresa",
    owner: "Jorge Castillo",
    status: "inactive",
    occupancy: 0,
    bedrooms: 1,
    bathrooms: 1,
  },
]

const statusColors: Record<PropertyStatus, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
}

export default function PropertiesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = mockProperties.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
          <p className="text-sm text-muted-foreground">
            Manage all your rental properties
          </p>
        </div>
        <Button asChild>
          <Link href="/onboarding">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by property name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">
            All ({mockProperties.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({mockProperties.filter((p) => p.status === "active").length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({mockProperties.filter((p) => p.status === "inactive").length})
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            Maintenance ({mockProperties.filter((p) => p.status === "maintenance").length})
          </TabsTrigger>
        </TabsList>

        {/* Table for all tabs - same content, filtered */}
        {["all", "active", "inactive", "maintenance"].map((tab) => (
          <TabsContent key={tab} value={tab}>
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
                          Address
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Owner
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Occupancy
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((property) => (
                        <tr
                          key={property.id}
                          className="border-b transition-colors hover:bg-muted/30"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{property.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {property.bedrooms}BD / {property.bathrooms}BA
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {property.address}
                          </td>
                          <td className="px-4 py-3">{property.owner}</td>
                          <td className="px-4 py-3">
                            <Badge
                              className={cn(
                                "capitalize",
                                statusColors[property.status]
                              )}
                            >
                              {property.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 rounded-full bg-muted">
                                <div
                                  className="h-2 rounded-full bg-emerald-500"
                                  style={{ width: `${property.occupancy}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">
                                {property.occupancy}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
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
                            No properties found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
