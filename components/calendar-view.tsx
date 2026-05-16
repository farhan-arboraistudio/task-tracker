"use client"

import { useState, useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useTasks } from "@/lib/task-context"
import type { Task } from "@/lib/types"
import { PRIORITY_INFO } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { TaskEditDialog } from "./task-edit-dialog"



interface DayProps {
  date: Date
  tasks: Task[]
  isCurrentMonth: boolean
  isSelected: boolean
  onSelect: () => void
}

function DayCell({ date, tasks, isCurrentMonth, isSelected, onSelect }: DayProps) {
  const today = isToday(date)
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
  )

  return (
    <button
      onClick={onSelect}
      className={`min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 rounded-lg transition-all text-left flex flex-col ${
        isCurrentMonth ? "" : "opacity-40"
      } ${
        isSelected
          ? "bg-[rgba(55,52,48,0.5)] ring-1 ring-foreground/20"
          : "hover:bg-[rgba(45,43,40,0.45)]"
      }`}
    >
      <span
        className={`text-xs sm:text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
          today
            ? "bg-foreground text-background"
            : isCurrentMonth
            ? "text-foreground"
            : "text-muted-foreground"
        }`}
      >
        {format(date, "d")}
      </span>
      <div className="flex-1 space-y-0.5 overflow-hidden">
        {tasks.slice(0, 3).map((task) => {
          const priorityInfo = PRIORITY_INFO[task.priority]
          const isOverdue = overdueTasks.some((t) => t.id === task.id)
          return (
            <div
              key={task.id}
              className={`text-[10px] truncate px-1 py-0.5 rounded ${
                task.status === "done"
                  ? "bg-[rgba(70,66,60,0.5)] text-muted-foreground line-through"
                  : isOverdue
                  ? "bg-red-500/20 text-red-400"
                  : "bg-[rgba(55,52,48,0.5)] text-foreground"
              }`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${priorityInfo.color}`}
              />
              {task.title}
            </div>
          )
        })}
        {tasks.length > 3 && (
          <span className="text-[10px] text-muted-foreground px-1">
            +{tasks.length - 3} more
          </span>
        )}
      </div>
    </button>
  )
}

interface DayDetailPanelProps {
  date: Date
  tasks: Task[]
  onClose: () => void
}

function DayDetailPanel({ date, tasks, onClose }: DayDetailPanelProps) {
  const { updateStatus } = useTasks()
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1
      if (a.status !== "done" && b.status === "done") return -1
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      return 0
    })
  }, [tasks])

  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full lg:w-80 rounded-xl glass-panel bg-[rgba(35,33,30,0.6)] p-4 flex-shrink-0"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-foreground">
            {format(date, "EEEE")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {format(date, "MMMM d, yyyy")}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[rgba(45,43,40,0.45)] text-muted-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Overdue Warning */}
      {overdueTasks.length > 0 && (
        <div className="mb-4 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">
            {overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Tasks */}
      <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No tasks for this day
          </div>
        ) : (
          sortedTasks.map((task) => {
            const priorityInfo = PRIORITY_INFO[task.priority]
            const isOverdue =
              task.dueDate &&
              new Date(task.dueDate) < new Date() &&
              task.status !== "done"

            return (
              <div
                key={task.id}
                className={`p-3 rounded-lg transition-colors ${
                  task.status === "done"
                    ? "bg-[rgba(45,43,40,0.45)] opacity-60"
                    : isOverdue
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-[rgba(45,43,40,0.45)] hover:bg-[rgba(55,52,48,0.5)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() =>
                      updateStatus(task.id, task.status === "done" ? "todo" : "done")
                    }
                    className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.status === "done"
                        ? "bg-foreground border-foreground"
                        : "border-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {task.status === "done" && (
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
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        task.status === "done"
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {task.dueDate && (
                        <span
                          className={`text-xs ${
                            isOverdue ? "text-red-400" : "text-muted-foreground"
                          }`}
                        >
                          {format(new Date(task.dueDate), "h:mm a")}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.color}`} />
                        {priorityInfo.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingTask(task)}
                    className="p-1 rounded hover:bg-[rgba(70,66,60,0.5)] text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <TaskEditDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      />
    </motion.div>
  )
}

export function CalendarView() {
  const { tasks } = useTasks()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const calendarDays = useMemo(() => {
    const days: Date[] = []
    let day = calendarStart
    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [calendarStart, calendarEnd])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd")
        const existing = map.get(dateKey) || []
        map.set(dateKey, [...existing, task])
      }
    })
    return map
  }, [tasks])

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = format(selectedDate, "yyyy-MM-dd")
    return tasksByDate.get(dateKey) || []
  }, [selectedDate, tasksByDate])

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentDate.getFullYear(), monthIndex, 1)
    setCurrentDate(newDate)
    setShowMonthPicker(false)
  }

  return (
    <div className="flex gap-4">
      {/* Calendar Grid */}
      <div className="flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="text-lg font-medium text-foreground hover:text-foreground/80 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {format(currentDate, "MMMM yyyy")}
                <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${showMonthPicker ? "rotate-90" : "-rotate-90"}`} />
              </button>

              {/* Month Picker Dropdown */}
              <AnimatePresence>
                {showMonthPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 z-50 glass-panel rounded-xl p-3 min-w-[240px]"
                  >
                    <p className="text-xs text-muted-foreground mb-2 text-center">{currentDate.getFullYear()}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {MONTHS.map((month, index) => {
                        const isCurrentMonth = currentDate.getMonth() === index
                        const isThisMonth = new Date().getMonth() === index && new Date().getFullYear() === currentDate.getFullYear()
                        return (
                          <button
                            key={month}
                            onClick={() => handleMonthSelect(index)}
                            className={`px-3 py-2 text-sm rounded-lg transition-all ${
                              isCurrentMonth
                                ? "bg-foreground text-background font-medium"
                                : isThisMonth
                                ? "ring-1 ring-foreground/20 text-foreground hover:bg-[rgba(70,66,60,0.5)]"
                                : "text-muted-foreground hover:text-foreground hover:bg-[rgba(70,66,60,0.5)]"
                            }`}
                          >
                            {month}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousMonth}
                className="p-1.5 rounded hover:bg-[rgba(45,43,40,0.45)] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-2 py-1 text-xs rounded hover:bg-[rgba(45,43,40,0.45)] text-muted-foreground hover:text-foreground transition-colors"
              >
                Today
              </button>
              <button
                onClick={goToNextMonth}
                className="p-1.5 rounded hover:bg-[rgba(45,43,40,0.45)] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd")
            const dayTasks = tasksByDate.get(dateKey) || []
            return (
              <DayCell
                key={dateKey}
                date={day}
                tasks={dayTasks}
                isCurrentMonth={isSameMonth(day, currentDate)}
                isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
                onSelect={() => setSelectedDate(day)}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Urgent
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-500" /> Low
          </span>
        </div>
      </div>

      {/* Day Detail Panel */}
      <AnimatePresence>
        {selectedDate && (
          <DayDetailPanel
            date={selectedDate}
            tasks={selectedDateTasks}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
