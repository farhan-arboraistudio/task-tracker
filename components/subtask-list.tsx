"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTasks } from "@/lib/task-context"
import type { Task } from "@/lib/types"

interface SubtaskListProps {
  task: Task
}

export function SubtaskList({ task }: SubtaskListProps) {
  const { addSubtask, toggleSubtask, deleteSubtask } = useTasks()
  const [newSubtask, setNewSubtask] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return
    addSubtask(task.id, newSubtask.trim())
    setNewSubtask("")
    setIsAdding(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddSubtask()
    } else if (e.key === "Escape") {
      setIsAdding(false)
      setNewSubtask("")
    }
  }

  const completedCount = task.subtasks.filter((s) => s.completed).length
  const totalCount = task.subtasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-foreground rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {completedCount} of {totalCount} done
          </span>
        </div>
      )}

      {/* Subtask list */}
      <AnimatePresence mode="popLayout">
        {task.subtasks.map((subtask) => (
          <motion.div
            key={subtask.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="group flex items-center gap-2 py-1"
          >
            <button
              onClick={() => toggleSubtask(task.id, subtask.id)}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                subtask.completed
                  ? "bg-foreground border-foreground"
                  : "border-muted-foreground hover:border-foreground"
              }`}
            >
              {subtask.completed && (
                <svg
                  className="w-2.5 h-2.5 text-background"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
            <span
              className={`flex-1 text-sm ${
                subtask.completed
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }`}
            >
              {subtask.title}
            </span>
            <button
              onClick={() => deleteSubtask(task.id, subtask.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-400 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add subtask */}
      {isAdding ? (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-4 h-4 rounded border border-muted-foreground" />
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newSubtask.trim()) {
                setIsAdding(false)
              }
            }}
            placeholder="Add subtask..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
        </motion.div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add subtask</span>
        </button>
      )}
    </div>
  )
}
