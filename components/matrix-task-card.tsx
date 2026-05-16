"use client"

import { motion } from "framer-motion"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Clock } from "lucide-react"
import type { Task, Quadrant } from "@/lib/types"
import { PRIORITY_INFO } from "@/lib/types"
import { formatDueDate } from "@/lib/task-parser"

interface MatrixTaskCardProps {
  task: Task
  quadrant: Quadrant
}

export function MatrixTaskCard({ task, quadrant }: MatrixTaskCardProps) {
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

  const priorityInfo = PRIORITY_INFO[task.priority]
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length
  const totalSubtasks = task.subtasks.length
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={`group flex items-start gap-2 p-3 rounded-xl glass glass-hover transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 shadow-lg ring-1 ring-[rgba(120,112,100,0.3)]" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-foreground truncate">{task.title}</p>
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${priorityInfo.color}`}
          />
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 text-xs ${
                isOverdue ? "text-red-400" : "text-muted-foreground"
              }`}
            >
              <Clock className="w-3 h-3" />
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>

        {totalSubtasks > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-foreground/50"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
        )}

        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
