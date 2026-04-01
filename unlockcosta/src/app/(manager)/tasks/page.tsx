"use client"

import { useState } from "react"
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
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
import { cn, formatDate } from "@/lib/utils"

type TaskStatus = "pending" | "in_progress" | "completed"
type TaskType = "cleaning" | "maintenance" | "inspection"

interface Task {
  id: string
  title: string
  property: string
  type: TaskType
  dueDate: string
  assignee: string
  status: TaskStatus
}

const initialTasks: Task[] = [
  {
    id: "T001",
    title: "Deep clean after checkout",
    property: "Villa Mar Azul",
    type: "cleaning",
    dueDate: "2026-04-04",
    assignee: "Maria Cleaning Co.",
    status: "pending",
  },
  {
    id: "T002",
    title: "Fix leaking faucet in bathroom",
    property: "Casa Tropical",
    type: "maintenance",
    dueDate: "2026-04-05",
    assignee: "Pedro Plumbing",
    status: "in_progress",
  },
  {
    id: "T003",
    title: "Pre-arrival inspection",
    property: "Penthouse Sunset",
    type: "inspection",
    dueDate: "2026-04-09",
    assignee: "Ana Rojas",
    status: "pending",
  },
  {
    id: "T004",
    title: "Replace AC filters",
    property: "Villa Mar Azul",
    type: "maintenance",
    dueDate: "2026-04-07",
    assignee: "TechCool Services",
    status: "pending",
  },
  {
    id: "T005",
    title: "Turnover cleaning",
    property: "Studio Playa Blanca",
    type: "cleaning",
    dueDate: "2026-04-03",
    assignee: "Maria Cleaning Co.",
    status: "completed",
  },
  {
    id: "T006",
    title: "Quarterly property inspection",
    property: "Casa Tropical",
    type: "inspection",
    dueDate: "2026-04-15",
    assignee: "Ana Rojas",
    status: "pending",
  },
]

const typeColors: Record<TaskType, string> = {
  cleaning: "bg-sky-100 text-sky-800 border-sky-200",
  maintenance: "bg-orange-100 text-orange-800 border-orange-200",
  inspection: "bg-violet-100 text-violet-800 border-violet-200",
}

const statusConfig: Record<TaskStatus, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-600" },
  in_progress: { label: "In Progress", icon: AlertCircle, color: "text-blue-600" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-green-600" },
}

const nextStatus: Record<TaskStatus, TaskStatus> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "completed",
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterProperty, setFilterProperty] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const properties = Array.from(new Set(tasks.map((t) => t.property)))

  const filtered = tasks.filter((t) => {
    if (filterProperty !== "all" && t.property !== filterProperty) return false
    if (filterType !== "all" && t.type !== filterType) return false
    if (filterStatus !== "all" && t.status !== filterStatus) return false
    return true
  })

  function advanceStatus(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: nextStatus[t.status] } : t
      )
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Manage cleaning, maintenance, and inspection tasks
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
              <DialogDescription>Create a new task for a property.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Task description" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-property">Property</Label>
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
                  <Label htmlFor="task-type">Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input id="due-date" type="date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Input id="assignee" placeholder="Name or company" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setDialogOpen(false)}>Create Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterProperty} onValueChange={setFilterProperty}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="inspection">Inspection</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filtered.map((task) => {
          const cfg = statusConfig[task.status]
          const StatusIcon = cfg.icon
          return (
            <Card key={task.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <StatusIcon className={cn("mt-0.5 h-5 w-5 shrink-0", cfg.color)} />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{task.title}</span>
                      <Badge className={cn("text-xs capitalize", typeColors[task.type])}>
                        {task.type}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{task.property}</span>
                      <span>Due: {formatDate(task.dueDate)}</span>
                      <span>Assignee: {task.assignee}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:ml-4">
                  <Badge
                    variant="outline"
                    className={cn("text-xs whitespace-nowrap", cfg.color)}
                  >
                    {cfg.label}
                  </Badge>
                  {task.status !== "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => advanceStatus(task.id)}
                      className="gap-1 text-xs"
                    >
                      {task.status === "pending" ? "Start" : "Complete"}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No tasks match your filters.
          </div>
        )}
      </div>
    </div>
  )
}
