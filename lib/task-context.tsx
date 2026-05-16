"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { addDays, addWeeks, addMonths } from "date-fns"
import type { Task, Status, Priority, Quadrant, Subtask, Settings, ViewType } from "./types"
import { inferQuadrant } from "./quadrant-engine"
import { syncTaskToGoogleCalendar, deleteFromGoogleCalendar } from "./gcal-sync"

interface TaskContextType {
  tasks: Task[]
  settings: Settings
  viewUsage: Record<string, number>
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  addSubtask: (taskId: string, title: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  deleteSubtask: (taskId: string, subtaskId: string) => void
  moveToQuadrant: (taskId: string, quadrant: Quadrant) => void
  reorderTask: (activeId: string, overId: string) => void
  updateStatus: (taskId: string, status: Status) => void
  duplicateTask: (taskId: string) => void
  carryForward: (taskId: string) => void
  setReminder: (taskId: string, reminder: Date | null) => void
  autoSortTasks: () => void
  updateSettings: (updates: Partial<Settings>) => void
  trackViewUsage: (view: ViewType) => void
  getMostUsedView: () => ViewType
  isLoaded: boolean
}

const TaskContext = createContext<TaskContextType | null>(null)

const STORAGE_KEY = "task-tracker-data"
const SETTINGS_KEY = "task-tracker-settings"
const VIEW_USAGE_KEY = "task-tracker-view-usage"

const DEFAULT_SETTINGS: Settings = {
  workDays: [0, 1, 2, 3],
  autoPriority: true,
  defaultView: "list",
  notificationsEnabled: false,
  defaultReminderMinutes: 15,
  googleCalendarConnected: false,
  autoAssignQuadrant: true,
  startupView: "list",
  showCompletedTasks: true,
  compactMode: false,
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function syncPriorityWithQuadrant(quadrant: Quadrant | null, currentPriority: Priority): Priority {
  if (!quadrant) return currentPriority
  if (quadrant === "do-first") return "urgent"
  if (quadrant === "schedule") return "high"
  if (quadrant === "delegate") return "medium"
  if (quadrant === "eliminate") return "low"
  return currentPriority
}

function loadTasks(): Task[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    return parsed.map((task: Record<string, unknown>) => ({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate as string) : null,
      createdAt: new Date(task.createdAt as string),
      updatedAt: new Date(task.updatedAt as string),
    }))
  } catch {
    return []
  }
}

function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

function loadViewUsage(): Record<string, number> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(VIEW_USAGE_KEY)
    if (!stored) return {}
    return JSON.parse(stored)
  } catch {
    return {}
  }
}

function saveViewUsage(usage: Record<string, number>) {
  if (typeof window === "undefined") return
  localStorage.setItem(VIEW_USAGE_KEY, JSON.stringify(usage))
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [viewUsage, setViewUsage] = useState<Record<string, number>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadTasks()
    setTasks(loaded)
    setSettings(loadSettings())
    setViewUsage(loadViewUsage())
    setIsLoaded(true)
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveTasks(tasks)
    }
  }, [tasks, isLoaded])

  // Save settings
  useEffect(() => {
    if (isLoaded) {
      saveSettings(settings)
    }
  }, [settings, isLoaded])

  const addTask = useCallback((task: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date()
    
    // Auto-assign quadrant and cohesive priority
    let quadrant = task.quadrant
    let priority = task.priority
    
    // Use engine if we need to auto-assign quadrant OR auto-infer priority
    if (settings.autoAssignQuadrant || settings.autoPriority) {
      const result = inferQuadrant({
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        tags: task.tags,
      })
      
      if (settings.autoAssignQuadrant && !task.quadrant) {
        quadrant = result.quadrant
      }
      
      if (settings.autoPriority && !quadrant) {
        // Only upgrade priority if the engine infers higher importance
        const priorityRank: Record<string, number> = { urgent: 3, high: 2, medium: 1, low: 0 }
        if (priorityRank[result.inferredPriority] > priorityRank[task.priority]) {
          priority = result.inferredPriority
        }
      }
    }
    
    // Always sync priority if quadrant is assigned to ensure visual consistency
    priority = syncPriorityWithQuadrant(quadrant, priority)
    
    const newTask: Task = {
      ...task,
      quadrant,
      priority,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }

    // Auto-set reminder based on defaultReminderMinutes if task has a due date
    if (newTask.dueDate && !newTask.reminder) {
      const reminderTime = new Date(newTask.dueDate.getTime() - settings.defaultReminderMinutes * 60000)
      if (reminderTime > now) {
        newTask.reminder = reminderTime
      }
    }

    setTasks((prev) => [newTask, ...prev])

    // Google Calendar Sync
    if (settings.googleCalendarConnected && newTask.dueDate) {
      const token = localStorage.getItem("gcal_access_token")
      if (token) {
        syncTaskToGoogleCalendar(newTask, token).then((eventId) => {
          if (eventId) {
            setTasks((prev) => prev.map((t) => t.id === newTask.id ? { ...t, gcalEventId: eventId } : t))
          }
        })
      }
    }
  }, [settings])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    let updatedTask: Task | null = null
    let newTaskToSpawn: Task | null = null

    setTasks((prev) => {
      const newTasks = prev.map((task) => {
        if (task.id !== id) return task
        const updated = { ...task, ...updates, updatedAt: new Date() }
        
        // Re-infer quadrant if priority or dueDate changed
        if (
          (updates.priority || updates.dueDate !== undefined) &&
          (settings.autoAssignQuadrant || settings.autoPriority)
        ) {
          const result = inferQuadrant({
            title: updated.title,
            dueDate: updated.dueDate,
            priority: updated.priority,
            tags: updated.tags,
          })
          
          if (settings.autoAssignQuadrant && !updates.quadrant && !updates.priority) {
            updated.quadrant = result.quadrant
          }
          
          if (settings.autoPriority && !updated.quadrant && !updates.priority) {
            // Sync priority with quadrant inference
            const priorityRank: Record<string, number> = { urgent: 3, high: 2, medium: 1, low: 0 }
            if (priorityRank[result.inferredPriority] > priorityRank[updated.priority]) {
              updated.priority = result.inferredPriority
            }
          }
        }
        
        // Ensure consistency, but don't override manual priority changes
        if (updates.priority) {
          // If user manually changed priority, update the quadrant to match if possible
          if (updates.priority === "urgent") updated.quadrant = "do-first"
          else if (updates.priority === "high") updated.quadrant = "schedule"
          else if (updates.priority === "medium") updated.quadrant = "delegate"
          else if (updates.priority === "low") updated.quadrant = "eliminate"
        } else if (updates.quadrant) {
           updated.priority = syncPriorityWithQuadrant(updated.quadrant, updated.priority)
        } else {
           updated.priority = syncPriorityWithQuadrant(updated.quadrant, updated.priority)
        }

        // Recurring logic
        if (updates.status === "done" && task.status !== "done" && updated.recurringPattern && updated.dueDate) {
          let nextDueDate = new Date(updated.dueDate)
          if (updated.recurringPattern === "daily") nextDueDate = addDays(nextDueDate, 1)
          else if (updated.recurringPattern === "weekly") nextDueDate = addWeeks(nextDueDate, 1)
          else if (updated.recurringPattern === "monthly") nextDueDate = addMonths(nextDueDate, 1)

          let nextReminder: Date | null = null
          if (updated.reminder) {
             const diff = updated.dueDate.getTime() - updated.reminder.getTime()
             nextReminder = new Date(nextDueDate.getTime() - diff)
          }

          newTaskToSpawn = {
            ...updated,
            id: generateId(),
            status: "todo",
            dueDate: nextDueDate,
            reminder: nextReminder,
            createdAt: new Date(),
            updatedAt: new Date(),
            gcalEventId: undefined, // Don't copy GCal ID so it creates a new event
          }
        }
        
        updatedTask = updated
        return updated
      })

      if (newTaskToSpawn) {
        return [newTaskToSpawn, ...newTasks]
      }
      return newTasks
    })

    // Google Calendar Sync
    if (updatedTask && settings.googleCalendarConnected) {
      const token = localStorage.getItem("gcal_access_token")
      const u = updatedTask as Task
      if (token && (updates.title || updates.dueDate !== undefined || updates.priority || updates.status || updates.notes)) {
        if (!u.dueDate && u.gcalEventId) {
          // If due date was removed, delete from gcal
          deleteFromGoogleCalendar(u.gcalEventId, token)
          setTasks((prev) => prev.map((t) => t.id === id ? { ...t, gcalEventId: undefined } : t))
        } else if (u.dueDate) {
          syncTaskToGoogleCalendar(u, token).then((eventId) => {
            if (eventId && !u.gcalEventId) {
              setTasks((prev) => prev.map((t) => t.id === id ? { ...t, gcalEventId: eventId } : t))
            }
          })
        }
      }

      if (newTaskToSpawn) {
        const spawned = newTaskToSpawn as Task;
        if (token && spawned.dueDate) {
          syncTaskToGoogleCalendar(spawned, token).then((eventId) => {
            if (eventId) {
              setTasks((prev) => prev.map((t) => t.id === spawned.id ? { ...t, gcalEventId: eventId } : t))
            }
          })
        }
      }
    }
  }, [settings])

  const deleteTask = useCallback((id: string) => {
    let deletedTask: Task | null = null
    setTasks((prev) => {
      const task = prev.find(t => t.id === id)
      if (task) deletedTask = task
      return prev.filter((t) => t.id !== id)
    })

    if (deletedTask && settings.googleCalendarConnected) {
      const token = localStorage.getItem("gcal_access_token")
      if (token && (deletedTask as Task).gcalEventId) {
        deleteFromGoogleCalendar((deletedTask as Task).gcalEventId!, token)
      }
    }
  }, [settings.googleCalendarConnected])

  const addSubtask = useCallback((taskId: string, title: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        const newSubtask: Subtask = {
          id: generateId(),
          title,
          completed: false,
        }
        return {
          ...task,
          subtasks: [...task.subtasks, newSubtask],
          updatedAt: new Date(),
        }
      })
    )
  }, [])

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        return {
          ...task,
          subtasks: task.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          ),
          updatedAt: new Date(),
        }
      })
    )
  }, [])

  const deleteSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        return {
          ...task,
          subtasks: task.subtasks.filter((st) => st.id !== subtaskId),
          updatedAt: new Date(),
        }
      })
    )
  }, [])

  const moveToQuadrant = useCallback((taskId: string, quadrant: Quadrant) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        const newPriority = syncPriorityWithQuadrant(quadrant, task.priority)
        return { ...task, quadrant, priority: newPriority, updatedAt: new Date() }
      })
    )
  }, [])

  const reorderTask = useCallback((activeId: string, overId: string) => {
    setTasks((prev) => {
      const activeIndex = prev.findIndex((t) => t.id === activeId)
      const overIndex = prev.findIndex((t) => t.id === overId)
      
      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return prev
      
      const newTasks = [...prev]
      const [activeTask] = newTasks.splice(activeIndex, 1)
      const overTask = prev[overIndex]
      
      // Update quadrant and priority if moving to a different quadrant
      if (activeTask.quadrant !== overTask.quadrant) {
        activeTask.quadrant = overTask.quadrant
        if (overTask.quadrant) {
          activeTask.priority = syncPriorityWithQuadrant(overTask.quadrant, activeTask.priority)
        }
        activeTask.updatedAt = new Date()
      }
      
      // Insert at the new index (which might have shifted due to the splice)
      const newOverIndex = newTasks.findIndex((t) => t.id === overId)
      
      // Determine if we are moving down or up to place it correctly
      // In a sorted list, we typically insert after if moving down, before if moving up
      // but simply inserting at the newOverIndex places it before the overTask
      const insertIndex = activeIndex < overIndex ? newOverIndex + 1 : newOverIndex
      newTasks.splice(insertIndex, 0, activeTask)
      
      return newTasks
    })
  }, [])

  const updateStatus = useCallback((taskId: string, status: Status) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status, updatedAt: new Date() }
          : task
      )
    )
  }, [])

  const duplicateTask = useCallback((taskId: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId)
      if (!task) return prev
      
      const now = new Date()
      const newTask: Task = {
        ...task,
        id: generateId(),
        title: `${task.title} (copy)`,
        status: "todo" as Status,
        subtasks: task.subtasks.map((st) => ({
          ...st,
          id: generateId(),
          completed: false,
        })),
        createdAt: now,
        updatedAt: now,
      }
      return [newTask, ...prev]
    })
  }, [])

  const carryForward = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(9, 0, 0, 0)
        return { ...task, dueDate: tomorrow, updatedAt: new Date() }
      })
    )
  }, [])

  const setReminder = useCallback((taskId: string, reminder: Date | null) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, reminder, updatedAt: new Date() }
          : task
      )
    )
  }, [])

  const autoSortTasks = useCallback(() => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.status === "done") return task

        const result = inferQuadrant({
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          tags: task.tags,
        })

        return { ...task, quadrant: result.quadrant, priority: result.inferredPriority, updatedAt: new Date() }
      })
    )
  }, [])

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates }
      saveSettings(newSettings)
      return newSettings
    })
  }, [])

  const trackViewUsage = useCallback((view: ViewType) => {
    setViewUsage((prev) => {
      const updated = { ...prev, [view]: (prev[view] || 0) + 1 }
      saveViewUsage(updated)
      return updated
    })
  }, [])

  const getMostUsedView = useCallback((): ViewType => {
    const entries = Object.entries(viewUsage)
    if (entries.length === 0) return "list"
    entries.sort((a, b) => b[1] - a[1])
    return entries[0][0] as ViewType
  }, [viewUsage])

  return (
    <TaskContext.Provider
      value={{
        tasks,
        settings,
        viewUsage,
        addTask,
        updateTask,
        deleteTask,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        moveToQuadrant,
        reorderTask,
        updateStatus,
        duplicateTask,
        carryForward,
        setReminder,
        autoSortTasks,
        updateSettings,
        trackViewUsage,
        getMostUsedView,
        isLoaded,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider")
  }
  return context
}
