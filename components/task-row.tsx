"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight, Pencil, Bell, Repeat, GripVertical, Flag, Calendar as CalendarIcon, Trash2, ArrowRight } from "lucide-react"
import { useTasks } from "@/lib/task-context"
import type { Task, Status, Priority } from "@/lib/types"
import { PRIORITY_INFO, STATUS_INFO, QUADRANT_INFO, getPriorityInfo } from "@/lib/types"
import { formatDueDate } from "@/lib/task-parser"
import { SubtaskList } from "./subtask-list"
import { TaskActionsMenu } from "./task-actions-menu"
import { TaskEditDialog } from "./task-edit-dialog"
import { ReminderDialog } from "./reminder-dialog"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format } from "date-fns"

interface TaskRowProps {
  task: Task
  isDragging?: boolean
  isSelectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
}

export function TaskRow({ task, isDragging, isSelectionMode, isSelected, onToggleSelect }: TaskRowProps) {
  const { updateStatus, updateTask, deleteTask } = useTasks()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const showActions = isHovering || isMenuOpen
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showReminderDialog, setShowReminderDialog] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length
  const totalSubtasks = task.subtasks.length
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  const priorityInfo = getPriorityInfo(task.priority, settings)

  const handleStatusChange = (status: Status) => {
    updateStatus(task.id, status)
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done"

  // Priority-based neon glow effect
  const glowClasses: Record<string, string> = {
    urgent: "bg-red-500 shadow-[0_0_20px_3px_rgba(239,68,68,0.4)]",
    high: "bg-amber-500 shadow-[0_0_20px_3px_rgba(245,158,11,0.4)]",
    medium: "bg-blue-500 shadow-[0_0_20px_3px_rgba(59,130,246,0.4)]",
    low: "bg-gray-500/50 shadow-[0_0_15px_2px_rgba(156,163,175,0.2)]",
  }
  const neonGlow = task.status !== "done" ? glowClasses[task.priority] : ""

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group ${isDragging ? "opacity-50" : ""}`}
    >
      <motion.div
        layout
        className={`rounded-xl transition-all duration-300 relative overflow-hidden ${
          isHovering || isExpanded || isMenuOpen
            ? "glass shadow-[0_0_24px_rgba(210,205,195,0.06)] ring-1 ring-[rgba(120,112,100,0.25)]"
            : ""
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Neon Edge Glow */}
        {neonGlow && (
          <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${neonGlow}`} />
        )}
        
        <div className="flex items-center gap-3 px-3 py-3 relative z-10">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Selection Checkbox (if in selection mode) */}
          {isSelectionMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect?.(task.id)}
              className="w-4 h-4 rounded border-[rgba(120,112,100,0.4)] bg-[rgba(45,43,40,0.5)] focus:ring-1 focus:ring-foreground accent-foreground cursor-pointer"
            />
          )}

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-[rgba(60,57,52,0.5)] transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Status Checkbox */}
          <button
            onClick={() =>
              handleStatusChange(task.status === "done" ? "todo" : "done")
            }
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              task.status === "done"
                ? "bg-foreground border-foreground"
                : "border-muted-foreground hover:border-foreground"
            }`}
          >
            {task.status === "done" && (
              <svg
                className="w-3 h-3 text-background"
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

          {/* Task Title (Clickable area) */}
          <div 
            className="flex-1 min-w-0 cursor-pointer select-none"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm break-words ${
                  task.status === "done"
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {task.title}
              </span>
              {task.tags.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  {task.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 text-xs bg-[rgba(60,57,52,0.4)] text-muted-foreground rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                  {task.tags.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{task.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
              {/* Indicators for recurring and reminder */}
              {(task.recurringPattern || task.reminder) && (
                <div className="hidden sm:flex items-center gap-1">
                  {task.recurringPattern && (
                    <span className="text-blue-400" title={`Repeats ${task.recurringPattern}`}>
                      <Repeat className="w-3 h-3" />
                    </span>
                  )}
                  {task.reminder && (
                    <span className="text-amber-400" title={`Reminder: ${format(new Date(task.reminder), "MMM d, h:mm a")}`}>
                      <Bell className="w-3 h-3" />
                    </span>
                  )}
                </div>
              )}
            </div>
            {totalSubtasks > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1 w-16 bg-[rgba(60,57,52,0.4)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-foreground"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as Status)}
            className={`hidden sm:block text-xs font-medium px-2 py-1 rounded-md appearance-none cursor-pointer transition-colors focus:outline-none w-[90px] text-center ${
              STATUS_INFO[task.status].bgColor
            } ${STATUS_INFO[task.status].color} hover:opacity-80`}
          >
            {Object.entries(STATUS_INFO).map(([value, info]) => (
              <option key={value} value={value} className="bg-popover text-foreground">
                {info.label}
              </option>
            ))}
          </select>

          {/* Due Date */}
          <span
            className={`hidden sm:block text-xs min-w-[80px] text-right ${
              isOverdue ? "text-red-400" : "text-muted-foreground"
            }`}
          >
            {formatDueDate(task.dueDate)}
          </span>

          {/* Priority Indicator */}
          <div
            className={`w-2 h-2 rounded-full ${priorityInfo.color}`}
            title={priorityInfo.label}
          />

          {/* Actions */}
          <div className="flex items-center gap-1 min-w-[64px] justify-end">
            <button
              onClick={() => setShowEditDialog(true)}
              className="p-1.5 rounded hover:bg-[rgba(60,57,52,0.5)] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              title="Edit task"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <div className={`transition-opacity duration-200 ${showActions ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <TaskActionsMenu
                task={task}
                onEdit={() => setShowEditDialog(true)}
                onSetReminder={() => setShowReminderDialog(true)}
                onOpenChange={setIsMenuOpen}
              />
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pl-14">
                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {/* Priority Quick Select */}
                  <div className="flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5 text-muted-foreground" />
                    {(Object.keys(PRIORITY_INFO) as Priority[]).map((value) => {
                      const info = getPriorityInfo(value, settings)
                      return (
                        <button
                          key={value}
                          onClick={() => updateTask(task.id, { priority: value })}
                          className={`px-2 py-0.5 text-xs rounded-md transition-all ${
                            task.priority === value
                              ? `${info.color} text-white font-medium`
                              : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                          }`}
                        >
                          {info.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="w-px h-4 bg-[rgba(120,112,100,0.2)]" />

                  {/* Status Quick Select */}
                  {(Object.entries(STATUS_INFO) as [Status, typeof STATUS_INFO[Status]][]).map(([value, info]) => (
                    <button
                      key={value}
                      onClick={() => updateStatus(task.id, value)}
                      className={`px-2 py-0.5 text-xs rounded-md transition-all ${
                        task.status === value
                          ? "bg-foreground text-background font-medium"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                      }`}
                    >
                      {info.label}
                    </button>
                  ))}

                  <div className="w-px h-4 bg-secondary" />

                  {/* Carry Forward */}
                  <button
                    onClick={() => {
                      const tomorrow = new Date()
                      tomorrow.setDate(tomorrow.getDate() + 1)
                      tomorrow.setHours(9, 0, 0, 0)
                      updateTask(task.id, { dueDate: tomorrow })
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-all"
                    title="Move to tomorrow"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Tomorrow
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-secondary text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>

                {/* Mobile info */}
                <div className="sm:hidden flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                  <span>{STATUS_INFO[task.status].label}</span>
                  <span className={isOverdue ? "text-red-400" : ""}>
                    {formatDueDate(task.dueDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${priorityInfo.color}`} />
                    {priorityInfo.label}
                  </span>
                </div>

                {/* Tags on mobile */}
                {task.tags.length > 0 && (
                  <div className="sm:hidden flex flex-wrap gap-1 mb-3">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 text-xs bg-[rgba(60,57,52,0.4)] text-muted-foreground rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Additional Details */}
                {(task.description || task.timeEstimate || task.notes) && (
                  <div className="mb-3 space-y-2 text-sm">
                    {task.description && (
                      <div className="text-muted-foreground">
                        <span className="text-foreground font-medium mr-2">Description:</span>
                        {task.description}
                      </div>
                    )}
                    {task.notes && (
                      <div className="text-muted-foreground">
                        <span className="text-foreground font-medium mr-2">Notes:</span>
                        {task.notes}
                      </div>
                    )}
                    {task.timeEstimate && (
                      <div className="text-muted-foreground">
                        <span className="text-foreground font-medium mr-2">Time Estimate:</span>
                        {task.timeEstimate}
                      </div>
                    )}
                  </div>
                )}

                <SubtaskList task={task} />
                
                {/* Links */}
                {task.links && (
                  <div className="mt-3 text-sm text-muted-foreground break-all">
                    <span className="text-foreground font-medium mr-2">Links:</span>
                    <a href={task.links.startsWith('http') ? task.links : `https://${task.links}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{task.links}</a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Edit Dialog */}
      <TaskEditDialog
        task={task}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      {/* Reminder Dialog */}
      <ReminderDialog
        task={task}
        open={showReminderDialog}
        onOpenChange={setShowReminderDialog}
      />
    </div>
  )
}
