"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useTasks } from "@/lib/task-context"
import { FilterBar } from "./filter-bar"
import { TaskRow } from "./task-row"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { FilterState, SortField, SortDirection, Task } from "@/lib/types"
import {
  isToday,
  isThisWeek,
  isBefore,
  startOfDay,
} from "date-fns"

export function TaskList() {
  const { tasks, settings } = useTasks()
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priority: "all",
    status: "all",
    dateRange: "all",
    tags: [],
  })
  const [sortField, setSortField] = useState<SortField>("dueDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    tasks.forEach((task) => task.tags.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [tasks])

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks]

    // Apply filters
    if (!settings.showCompletedTasks) {
      result = result.filter((task) => task.status !== "done")
    }

    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
          (task.notes && task.notes.toLowerCase().includes(searchLower))
      )
    }

    if (filters.priority !== "all") {
      result = result.filter((task) => task.priority === filters.priority)
    }

    if (filters.status !== "all") {
      result = result.filter((task) => task.status === filters.status)
    }

    if (filters.dateRange !== "all") {
      const now = new Date()
      const todayStart = startOfDay(now)
      
      result = result.filter((task) => {
        if (!task.dueDate) {
          return filters.dateRange === "noDate"
        }
        const dueDate = new Date(task.dueDate)
        switch (filters.dateRange) {
          case "today":
            return isToday(dueDate)
          case "week":
            return isThisWeek(dueDate)
          case "overdue":
            return isBefore(dueDate, todayStart) && task.status !== "done"
          case "noDate":
            return false
          default:
            return true
        }
      })
    }

    if (filters.tags.length > 0) {
      result = result.filter((task) =>
        filters.tags.some((tag) => task.tags.includes(tag))
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case "dueDate":
          if (!a.dueDate && !b.dueDate) comparison = 0
          else if (!a.dueDate) comparison = 1
          else if (!b.dueDate) comparison = -1
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          break
        case "priority": {
          const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
          comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
          break
        }
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
      }
      
      return sortDirection === "asc" ? comparison : -comparison
    })

    return result
  }, [tasks, filters, sortField, sortDirection])

  const taskIds = useMemo(() => filteredAndSortedTasks.map((t) => t.id), [filteredAndSortedTasks])

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.status === "done").length
    const inProgress = tasks.filter((t) => t.status === "in-progress").length
    const todo = tasks.filter((t) => t.status === "todo").length
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
    ).length
    return { total, done, inProgress, todo, overdue }
  }, [tasks])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">All Tasks</h2>
          <p className="text-sm text-muted-foreground">
            {stats.done} of {stats.total} completed
            {stats.overdue > 0 && (
              <span className="text-red-400 ml-2">({stats.overdue} overdue)</span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={(field, direction) => {
          setSortField(field)
          setSortDirection(direction)
        }}
        availableTags={availableTags}
      />

      {/* Results summary */}
      {(filters.search || filters.priority !== "all" || filters.status !== "all" || 
        filters.dateRange !== "all" || filters.tags.length > 0 || !settings.showCompletedTasks) && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
        </p>
      )}

      {/* Task List */}
      <div className="space-y-1">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {filteredAndSortedTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center text-muted-foreground"
            >
              {filters.search || filters.priority !== "all" || filters.status !== "all" ||
               filters.dateRange !== "all" || filters.tags.length > 0 ? (
                <div>
                  <p>No tasks match your filters</p>
                  <button
                    onClick={() => setFilters({
                      search: "",
                      priority: "all",
                      status: "all",
                      dateRange: "all",
                      tags: [],
                    })}
                    className="text-foreground underline mt-2"
                  >
                    Clear filters
                  </button>
                </div>
              ) : !settings.showCompletedTasks && stats.done > 0 ? (
                <p>{stats.done} completed tasks hidden</p>
              ) : (
                <p>No tasks yet. Add one above!</p>
              )}
            </motion.div>
          ) : (
            filteredAndSortedTasks.map((task) => <TaskRow key={task.id} task={task} />)
          )}
        </SortableContext>
      </div>
    </div>
  )
}
