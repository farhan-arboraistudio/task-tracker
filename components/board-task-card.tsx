"use client"

import { motion } from "framer-motion"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Clock } from "lucide-react"
import type { Task } from "@/lib/types"
import { getPriorityInfo } from "@/lib/types"
import { formatDueDate } from "@/lib/task-parser"
import { useTasks } from "@/lib/task-context"

interface BoardTaskCardProps {
  task: Task
}

export function BoardTaskCard({ task }: BoardTaskCardProps) {
  const { settings } = useTasks()
  const priorityInfo = getPriorityInfo(task.priority, settings)
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done"
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      className={`glass rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all ${
        task.status === "done" ? "opacity-60" : ""
      } ${isDragging ? "opacity-50 scale-95 shadow-lg ring-1 ring-border z-50 relative" : "glass-hover"}`}
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
    </motion.div>
  )
}
