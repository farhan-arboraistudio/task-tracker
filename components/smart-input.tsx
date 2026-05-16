"use client"

import { useState, useMemo } from "react"
import { Plus, Calendar, Flag, Hash, Sparkles, FormInput } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTasks } from "@/lib/task-context"
import { parseTaskInput, formatDueDate } from "@/lib/task-parser"
import { PRIORITY_INFO, getPriorityInfo } from "@/lib/types"
import { inferQuadrant } from "@/lib/quadrant-engine"
import { ManualTaskForm } from "./manual-task-form"

type InputMode = "smart" | "manual"

export function SmartInput() {
  const { addTask, settings } = useTasks()
  const [input, setInput] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>("smart")

  const parsedTask = useMemo(() => {
    if (!input.trim()) return null
    const parsed = parseTaskInput(input)
    
    // Accurately reflect auto-priority in the preview
    if (settings.autoPriority) {
      const result = inferQuadrant({
        title: parsed.title,
        dueDate: parsed.dueDate,
        priority: parsed.priority,
        tags: parsed.tags,
      })
      const priorityRank: Record<string, number> = { urgent: 3, high: 2, medium: 1, low: 0 }
      if (priorityRank[result.inferredPriority] > priorityRank[parsed.priority]) {
        parsed.priority = result.inferredPriority
      }
    }
    
    return parsed
  }, [input, settings.autoPriority])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!parsedTask || !parsedTask.title.trim()) return

    addTask({
      title: parsedTask.title,
      dueDate: parsedTask.dueDate,
      priority: parsedTask.priority,
      status: "todo",
      quadrant: null,
      subtasks: [],
      tags: parsedTask.tags,
      notes: "",
      reminder: null,
      recurringPattern: null,
    })

    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="sticky top-0 z-20 pb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pt-4 -mt-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
          <button
            onClick={() => setInputMode("smart")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              inputMode === "smart"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Smart
          </button>
          <button
            onClick={() => setInputMode("manual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              inputMode === "manual"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FormInput className="w-4 h-4" />
            Manual
          </button>
        </div>
        <span className="text-xs text-muted-foreground">
          {inputMode === "smart" 
            ? "Type naturally with dates and priorities" 
            : "Fill in task details step by step"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {inputMode === "smart" ? (
          <motion.div
            key="smart"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <form onSubmit={handleSubmit}>
              <div
                className={`rounded-xl transition-all duration-200 glass ${
                  isFocused ? "shadow-[0_0_30px_rgba(210,205,195,0.06)] ring-1 ring-[rgba(120,112,100,0.25)]" : ""
                }`}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder='Add a task... try "Meeting tomorrow 2pm urgent #work"'
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <AnimatePresence>
                    {input.trim() && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        type="submit"
                        className="px-4 py-1.5 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-colors"
                      >
                        Add
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Smart Preview */}
                <AnimatePresence>
                  {parsedTask && input.trim() && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 pt-1 border-t border-[rgba(100,95,85,0.2)]">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Sparkles className="w-3 h-3" />
                          <span>Smart parsing preview</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Title */}
                          <span className="text-sm text-foreground font-medium">
                            {parsedTask.title || input}
                          </span>

                          {/* Date */}
                          {parsedTask.dueDate && (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 bg-secondary/80 text-teal-500 rounded">
                              <Calendar className="w-3 h-3" />
                              {formatDueDate(parsedTask.dueDate)}
                            </span>
                          )}

                          {/* Priority */}
                          {(parsedTask.isPriorityExplicit || settings.autoPriority) && (
                            <span
                            className={`flex items-center gap-1 text-xs px-2 py-1 bg-secondary/80 rounded ${
                              getPriorityInfo(parsedTask.priority, settings).color.replace('bg-', 'text-')
                            }`}
                          >
                            <Flag className="w-3 h-3" />
                            {getPriorityInfo(parsedTask.priority, settings).label}
                          </span>
                          )}

                          {/* Tags */}
                          {parsedTask.tags.map((tag) => (
                            <span
                              key={tag}
                              className="flex items-center gap-1 text-xs px-2 py-1 bg-secondary/80 text-muted-foreground rounded"
                            >
                              <Hash className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>

            {/* Helper text */}
            <AnimatePresence>
              {isFocused && !input && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-2 text-xs text-muted-foreground"
                >
                  <span className="font-medium">Tips:</span> Use natural language like{" "}
                  <span className="text-foreground/70">tomorrow</span>,{" "}
                  <span className="text-foreground/70">next monday 3pm</span>, or{" "}
                  <span className="text-foreground/70">urgent</span>. Add tags with{" "}
                  <span className="text-foreground/70">#tag</span>.
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <ManualTaskForm />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
