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
  gcalEventId?: string
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
  notificationSoundEnabled?: boolean
  googleCalendarConnected?: boolean
  autoAssignQuadrant: boolean
  startupView: ViewType
  showCompletedTasks: boolean
  compactMode: boolean
  customPriorityColors?: Partial<Record<Priority, string>>
  customPriorityLabels?: Partial<Record<Priority, string>>
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
  const color = settings?.customPriorityColors?.[priority] || defaultInfo.color
  const label = settings?.customPriorityLabels?.[priority] || defaultInfo.label
  
  return { ...defaultInfo, color, label }
}

export function getPriorityStyles(bgColor: string) {
  const styles: Record<string, { border: string; shadow: string }> = {
    "bg-red-500": { border: "border-red-500", shadow: "shadow-red-500" },
    "bg-amber-500": { border: "border-amber-500", shadow: "shadow-amber-500" },
    "bg-emerald-500": { border: "border-emerald-500", shadow: "shadow-emerald-500" },
    "bg-blue-500": { border: "border-blue-500", shadow: "shadow-blue-500" },
    "bg-indigo-500": { border: "border-indigo-500", shadow: "shadow-indigo-500" },
    "bg-purple-500": { border: "border-purple-500", shadow: "shadow-purple-500" },
    "bg-pink-500": { border: "border-pink-500", shadow: "shadow-pink-500" },
    "bg-rose-500": { border: "border-rose-500", shadow: "shadow-rose-500" },
    "bg-orange-500": { border: "border-orange-500", shadow: "shadow-orange-500" },
    "bg-teal-500": { border: "border-teal-500", shadow: "shadow-teal-500" },
    "bg-cyan-500": { border: "border-cyan-500", shadow: "shadow-cyan-500" },
    "bg-gray-500": { border: "border-gray-500", shadow: "shadow-gray-500" },
  }
  return styles[bgColor] || { border: "border-transparent", shadow: "shadow-transparent" }
}

export function getQuadrantInfo(quadrant: Quadrant, settings?: Settings) {
  if (!quadrant) return null
  const baseInfo = QUADRANT_INFO[quadrant]
  
  const quadrantToPriority: Record<NonNullable<Quadrant>, Priority> = {
    "do-first": "urgent",
    "schedule": "high",
    "delegate": "medium",
    "eliminate": "low",
  }
  
  const mappedPriority = quadrantToPriority[quadrant]
  const priorityColor = getPriorityInfo(mappedPriority, settings).color
  
  return {
    ...baseInfo,
    color: `${priorityColor}/10`,
    borderColor: `${priorityColor.replace("bg-", "border-")}/20`,
    textColor: priorityColor.replace("bg-", "text-").replace("-500", "-400"),
  }
}

export const STATUS_INFO: Record<Status, { label: string; color: string; bgColor: string }> = {
  todo: { label: "To Do", color: "text-muted-foreground", bgColor: "bg-secondary" },
  "in-progress": { label: "In Progress", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  done: { label: "Done", color: "text-green-500", bgColor: "bg-green-500/10" },
}
