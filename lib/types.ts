export type Priority = "urgent" | "high" | "medium" | "low"
export type Status = "todo" | "in-progress" | "done"
export type Quadrant = "do-first" | "schedule" | "delegate" | "eliminate" | null

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  dueDate: Date | null
  priority: Priority
  status: Status
  quadrant: Quadrant
  subtasks: Subtask[]
  tags: string[]
  notes: string
  description?: string
  links?: string
  timeEstimate?: string
  reminder: Date | null
  recurringPattern: "daily" | "weekly" | "monthly" | null
  createdAt: Date
  updatedAt: Date
}

export type ViewType = "list" | "board" | "calendar" | "compact" | "matrix"

export type SortField = "dueDate" | "priority" | "createdAt" | "title"
export type SortDirection = "asc" | "desc"

export interface FilterState {
  search: string
  priority: Priority | "all"
  status: Status | "all"
  dateRange: "all" | "today" | "week" | "overdue" | "noDate"
  tags: string[]
}

export interface Settings {
  workDays: number[]
  autoPriority: boolean
  defaultView: ViewType
  notificationsEnabled: boolean
  defaultReminderMinutes: number
  googleCalendarConnected?: boolean
  autoAssignQuadrant: boolean
  startupView: ViewType
  showCompletedTasks: boolean
  compactMode: boolean
  customPriorityColors?: Partial<Record<Priority, string>>
}

export interface ParsedTask {
  title: string
  dueDate: Date | null
  priority: Priority
  isPriorityExplicit: boolean
  tags: string[]
}

// Custom work week configuration (Sunday through Wednesday)
export const WORK_DAYS = [0, 1, 2, 3] // Sunday = 0, Wednesday = 3

export const PRIORITY_KEYWORDS: Record<string, Priority> = {
  urgent: "urgent",
  asap: "urgent",
  critical: "urgent",
  important: "high",
  high: "high",
  medium: "medium",
  normal: "medium",
  low: "low",
  minor: "low",
}

export const QUADRANT_INFO = {
  "do-first": {
    label: "Do First",
    description: "Urgent & Important",
    color: "bg-red-500/10",
    borderColor: "border-red-500/20",
    textColor: "text-red-400",
  },
  schedule: {
    label: "Schedule",
    description: "Not Urgent & Important",
    color: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-400",
  },
  delegate: {
    label: "Delegate",
    description: "Urgent & Not Important",
    color: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-400",
  },
  eliminate: {
    label: "Don't Do",
    description: "Not Urgent & Not Important",
    color: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
    textColor: "text-gray-400",
  },
}

export const PRIORITY_INFO: Record<Priority, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "bg-red-500" },
  high: { label: "High", color: "bg-amber-500" },
  medium: { label: "Medium", color: "bg-blue-500" },
  low: { label: "Low", color: "bg-gray-500" },
}

export const PRIORITY_COLOR_OPTIONS = [
  "bg-red-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-rose-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-gray-500",
]

export function getPriorityInfo(priority: Priority, settings?: Settings) {
  const defaultInfo = PRIORITY_INFO[priority]
  if (settings?.customPriorityColors?.[priority]) {
    return { ...defaultInfo, color: settings.customPriorityColors[priority] }
  }
  return defaultInfo
}

export const STATUS_INFO: Record<Status, { label: string; color: string; bgColor: string }> = {
  todo: { label: "To Do", color: "text-muted-foreground", bgColor: "bg-secondary" },
  "in-progress": { label: "In Progress", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  done: { label: "Done", color: "text-green-500", bgColor: "bg-green-500/10" },
}
