"use client"

import { useState } from "react"
import {
  CalendarDays,
  Plus,
  User,
  Home,
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
import { cn, formatCurrency, formatDate } from "@/lib/utils"

type ReservationStatus = "upcoming" | "active" | "completed"
type Platform = "airbnb" | "booking" | "direct"

interface Reservation {
  id: string
  guestName: string
  property: string
  checkIn: string
  checkOut: string
  amount: number
  platform: Platform
  status: ReservationStatus
  guests: number
}

const mockReservations: Reservation[] = [
  {
    id: "R001",
    guestName: "James Wilson",
    property: "Villa Mar Azul",
    checkIn: "2026-04-10",
    checkOut: "2026-04-17",
    amount: 1850,
    platform: "airbnb",
    status: "upcoming",
    guests: 4,
  },
  {
    id: "R002",
    guestName: "Emma Thompson",
    property: "Casa Tropical",
    checkIn: "2026-04-12",
    checkOut: "2026-04-19",
    amount: 2400,
    platform: "booking",
    status: "upcoming",
    guests: 6,
  },
  {
    id: "R003",
    guestName: "Michael Brown",
    property: "Penthouse Sunset",
    checkIn: "2026-04-05",
    checkOut: "2026-04-15",
    amount: 3200,
    platform: "airbnb",
    status: "upcoming",
    guests: 3,
  },
  {
    id: "R004",
    guestName: "Sarah Garcia",
    property: "Villa Mar Azul",
    checkIn: "2026-03-28",
    checkOut: "2026-04-04",
    amount: 1650,
    platform: "direct",
    status: "active",
    guests: 2,
  },
  {
    id: "R005",
    guestName: "David Chen",
    property: "Casa Tropical",
    checkIn: "2026-03-30",
    checkOut: "2026-04-06",
    amount: 2100,
    platform: "booking",
    status: "active",
    guests: 5,
  },
  {
    id: "R006",
    guestName: "Laura Martinez",
    property: "Penthouse Sunset",
    checkIn: "2026-03-15",
    checkOut: "2026-03-22",
    amount: 2800,
    platform: "airbnb",
    status: "completed",
    guests: 4,
  },
  {
    id: "R007",
    guestName: "Tom Anderson",
    property: "Villa Mar Azul",
    checkIn: "2026-03-10",
    checkOut: "2026-03-17",
    amount: 1750,
    platform: "booking",
    status: "completed",
    guests: 2,
  },
  {
    id: "R008",
    guestName: "Nina Petrov",
    property: "Studio Playa Blanca",
    checkIn: "2026-03-05",
    checkOut: "2026-03-12",
    amount: 950,
    platform: "direct",
    status: "completed",
    guests: 1,
  },
]

const platformColors: Record<Platform, string> = {
  airbnb: "bg-rose-100 text-rose-800 border-rose-200",
  booking: "bg-blue-100 text-blue-800 border-blue-200",
  direct: "bg-purple-100 text-purple-800 border-purple-200",
}

const columnConfig: { status: ReservationStatus; label: string; color: string }[] = [
  { status: "upcoming", label: "Upcoming", color: "bg-blue-500" },
  { status: "active", label: "Active", color: "bg-emerald-500" },
  { status: "completed", label: "Completed", color: "bg-gray-400" },
]

export default function ReservationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const getByStatus = (status: ReservationStatus) =>
    mockReservations.filter((r) => r.status === status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage all guest reservations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Reservation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Reservation</DialogTitle>
              <DialogDescription>
                Add a new reservation manually.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="guest">Guest Name</Label>
                <Input id="guest" placeholder="Full name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="property">Property</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="villa-mar-azul">Villa Mar Azul</SelectItem>
                    <SelectItem value="casa-tropical">Casa Tropical</SelectItem>
                    <SelectItem value="penthouse-sunset">Penthouse Sunset</SelectItem>
                    <SelectItem value="studio-playa-blanca">Studio Playa Blanca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="checkin">Check-in</Label>
                  <Input id="checkin" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="checkout">Check-out</Label>
                  <Input id="checkout" type="date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (EUR)</Label>
                  <Input id="amount" type="number" placeholder="0.00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                      <SelectItem value="booking">Booking.com</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="guests">Number of Guests</Label>
                <Input id="guests" type="number" placeholder="1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setDialogOpen(false)}>
                Create Reservation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {columnConfig.map((col) => {
          const items = getByStatus(col.status)
          const total = items.reduce((sum, r) => sum + r.amount, 0)
          return (
            <Card key={col.status}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn("h-10 w-1 rounded-full", col.color)} />
                <div>
                  <p className="text-sm text-muted-foreground">{col.label}</p>
                  <p className="text-2xl font-bold">{items.length}</p>
                </div>
                <p className="ml-auto text-sm font-medium text-muted-foreground">
                  {formatCurrency(total)}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid gap-6 lg:grid-cols-3">
        {columnConfig.map((col) => {
          const items = getByStatus(col.status)
          return (
            <div key={col.status} className="space-y-3">
              {/* Column header */}
              <div className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", col.color)} />
                <h3 className="font-semibold">{col.label}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {items.length}
                </Badge>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {items.map((reservation) => (
                  <Card
                    key={reservation.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {reservation.guestName}
                          </span>
                        </div>
                        <Badge
                          className={cn(
                            "text-xs capitalize",
                            platformColors[reservation.platform]
                          )}
                        >
                          {reservation.platform}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Home className="h-3 w-3" />
                        {reservation.property}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(reservation.checkIn)} &mdash;{" "}
                        {formatDate(reservation.checkOut)}
                      </div>

                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="text-xs text-muted-foreground">
                          {reservation.guests} guest{reservation.guests > 1 ? "s" : ""}
                        </span>
                        <span className="font-semibold text-sm">
                          {formatCurrency(reservation.amount)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
