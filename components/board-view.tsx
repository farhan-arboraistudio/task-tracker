"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { useTasks } from "@/lib/task-context"
import type { Task, Status } from "@/lib/types"
import { STATUS_INFO, PRIORITY_INFO } from "@/lib/types"
import { formatDueDate } from "@/lib/task-parser"
import { Clock, CheckCircle2 } from "lucide-react"

const COLUMNS: { status: Status; label: string }[] = [
  { status: "todo", label: "To Do" },
  { status: "in-progress", label: "In Progress" },
  { status: "done", label: "Done" },
]

export function BoardView() {
  const { tasks, updateStatus } = useTasks()

  const tasksByStatus = useMemo(() => {
    const map: Record<Status, Task[]> = {
      "todo": [],
      "in-progress": [],
      "done": [],
    }
    tasks.forEach((task) => {
      if (map[task.status]) {
        map[task.status].push(task)
      }
    })
    return map
  }, [tasks])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
      {COLUMNS.map((col) => {
        const columnTasks = tasksByStatus[col.status]
        return (
          <div
            key={col.status}
            className="glass rounded-xl p-3 flex flex-col"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-medium text-foreground">{col.label}</h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {columnTasks.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-8 opacity-50">
                  No tasks
                </div>
              ) : (
                columnTasks.map((task, index) => {
                  const priorityInfo = PRIORITY_INFO[task.priority]
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    task.status !== "done"
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`glass glass-hover rounded-lg p-3 cursor-default transition-all ${
                        task.status === "done" ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm text-foreground leading-snug ${
                            task.status === "done" ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {task.title}
                        </p>
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${priorityInfo.color}`}
                          title={priorityInfo.label}
                        />
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 text-[11px] ${
                              isOverdue ? "text-red-400" : "text-muted-foreground"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {formatDueDate(task.dueDate)}
                          </span>
                        )}
                        {task.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] text-muted-foreground bg-[rgba(60,57,52,0.4)] px-1.5 py-0.5 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Quick status change */}
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                        {COLUMNS.filter((c) => c.status !== col.status).map((target) => (
                          <button
                            key={target.status}
                            onClick={() => updateStatus(task.id, target.status)}
                            className="text-[10px] px-2 py-0.5 rounded bg-[rgba(45,43,40,0.4)] text-muted-foreground hover:text-foreground transition-all"
                          >
                            → {target.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
