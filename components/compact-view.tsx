"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useTasks } from "@/lib/task-context"
import { PRIORITY_INFO, STATUS_INFO, getPriorityInfo } from "@/lib/types"
import type { FilterState, Task } from "@/lib/types"
import { formatDueDate } from "@/lib/task-parser"
import { isToday, isThisWeek, isBefore, startOfDay } from "date-fns"
import { CheckCircle2 } from "lucide-react"

export function CompactView() {
  const { tasks, updateStatus, settings, updateSettings } = useTasks()

  const sortedTasks = useMemo(() => {
    let result = [...tasks]
    if (!settings.showCompletedTasks) {
      result = result.filter((t) => t.status !== "done")
    }
    // Sort: overdue first, then by due date, then by priority
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    result.sort((a, b) => {
      const now = new Date()
      const aOverdue = a.dueDate && new Date(a.dueDate) < now && a.status !== "done"
      const bOverdue = b.dueDate && new Date(b.dueDate) < now && b.status !== "done"
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      if (a.dueDate && !b.dueDate) return -1
      if (!a.dueDate && b.dueDate) return 1
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    return result
  }, [tasks, settings.showCompletedTasks])

  const doneCount = tasks.filter((t) => t.status === "done").length

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">
          {doneCount}/{tasks.length} done
        </p>
        <button
          onClick={() => updateSettings({ showCompletedTasks: !settings.showCompletedTasks })}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {!settings.showCompletedTasks ? "Show completed" : "Hide completed"}
        </button>
      </div>

      {/* Compact Rows */}
      <div className="glass rounded-xl overflow-hidden divide-y divide-[rgba(120,112,100,0.1)]">
        {sortedTasks.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No tasks to show
          </div>
        ) : (
          sortedTasks.map((task) => {
            const priorityInfo = getPriorityInfo(task.priority, settings)
            const isOverdue =
              task.dueDate &&
              new Date(task.dueDate) < new Date() &&
              task.status !== "done"
            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 px-3 py-2 hover:bg-secondary/60 transition-colors ${
                  task.status === "done" ? "opacity-50" : ""
                }`}
              >
                {/* Due Date (Compact) */}
                {task.dueDate && (
                  <span
                    className={`text-[10px] min-w-[50px] ${
                      isOverdue ? "text-red-400" : "text-muted-foreground"
                    }`}
                  >
                    {format(new Date(task.dueDate), "MMM d")}
                  </span>
                )}

                {/* Priority dot */}
                <div
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityInfo.color}`}
                />

                {/* Title */}
                <span
                  className={`flex-1 text-sm truncate ${
                    task.status === "done"
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {task.title}
                </span>

                {/* Checkbox (Toggle) */}
                <button
                  onClick={() =>
                    updateStatus(task.id, task.status === "done" ? "todo" : "done")
                  }
                  className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                    task.status === "done"
                      ? "bg-foreground border-foreground"
                      : "border-muted-foreground hover:border-foreground"
                  }`}
                >
                  {task.status === "done" && (
                    <CheckCircle2 className="w-3 h-3 text-background" />
                  )}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
