"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useDroppable, useDraggable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useTasks } from "@/lib/task-context"
import type { Quadrant, Task, Priority } from "@/lib/types"
import { QUADRANT_INFO, PRIORITY_INFO, getPriorityInfo, getQuadrantInfo } from "@/lib/types"
import { MatrixTaskCard } from "./matrix-task-card"
import { Wand2, ChevronRight, ChevronLeft, Filter, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDueDate } from "@/lib/task-parser"



interface QuadrantDropZoneProps {
  quadrant: Quadrant
  tasks: Task[]
}

function QuadrantDropZone({ quadrant, tasks }: QuadrantDropZoneProps) {
  const { settings } = useTasks()
  const info = getQuadrantInfo(quadrant!, settings)!
  
  const { setNodeRef, isOver } = useDroppable({
    id: quadrant as string,
  })

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks])

  return (
    <motion.div
      ref={setNodeRef}
      layout
      className={`flex flex-col rounded-xl p-3 min-h-[180px] lg:min-h-[220px] transition-colors duration-200 text-xs ${
        info.color
      } ${isOver ? "ring-2 ring-foreground/20" : ""}`}
    >
      <div className="mb-2">
        <h3 className={`font-medium text-xs ${info.textColor}`}>
          {info.label}
        </h3>
        <p className="text-[10px] text-muted-foreground">{info.description}</p>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[80px] text-[10px] text-muted-foreground">
              Drop tasks here
            </div>
          ) : (
            tasks.map((task) => (
              <MatrixTaskCard key={task.id} task={task} quadrant={quadrant} />
            ))
          )}
        </SortableContext>
      </div>
    </motion.div>
  )
}

interface DraggableSidebarTaskProps {
  task: Task
}

function DraggableSidebarTask({ task }: DraggableSidebarTaskProps) {
  const { moveToQuadrant, settings } = useTasks()
  const priorityInfo = getPriorityInfo(task.priority, settings)
  
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  })

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`p-2 rounded-lg bg-secondary cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-50 scale-95" : "hover:bg-secondary/80"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${priorityInfo.color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
              {formatDueDate(task.dueDate)}
            </span>
            <span className="text-[10px] text-muted-foreground">{priorityInfo.label}</span>
          </div>
        </div>
      </div>
      
      {/* Quick assign buttons */}
      <div className="flex gap-1 mt-2">
        {(Object.keys(QUADRANT_INFO) as Quadrant[]).map((q) => {
          if (!q) return null
          const qInfo = getQuadrantInfo(q!, settings)!
          return (
            <button
              key={q}
              onClick={(e) => {
                e.stopPropagation()
                moveToQuadrant(task.id, q)
              }}
              className={`flex-1 px-1 py-0.5 text-[9px] rounded ${qInfo.color} ${qInfo.textColor} hover:opacity-80 transition-opacity`}
              title={qInfo.label}
            >
              {qInfo.label.split(" ")[0]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function EisenhowerMatrix() {
  const { tasks, autoSortTasks, settings } = useTasks()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarFilter, setSidebarFilter] = useState<"all" | "unassigned" | Priority>("unassigned")

  const tasksByQuadrant = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      "do-first": [],
      schedule: [],
      delegate: [],
      eliminate: [],
    }

    tasks
      .filter((t) => (!settings.showCompletedTasks ? t.status !== "done" : true) && t.quadrant)
      .forEach((task) => {
        if (task.quadrant && grouped[task.quadrant]) {
          grouped[task.quadrant].push(task)
        }
      })

    return grouped
  }, [tasks])

  const sidebarTasks = useMemo(() => {
    let filtered = tasks.filter((t) => !settings.showCompletedTasks ? t.status !== "done" : true)
    
    if (sidebarFilter === "unassigned") {
      filtered = filtered.filter((t) => !t.quadrant)
    } else if (sidebarFilter !== "all") {
      filtered = filtered.filter((t) => t.priority === sidebarFilter)
    }
    
    return filtered
  }, [tasks, sidebarFilter])

  const unassignedCount = useMemo(
    () => tasks.filter((t) => !t.quadrant && (!settings.showCompletedTasks ? t.status !== "done" : true)).length,
    [tasks]
  )

  return (
    <div className="flex gap-4">
      {/* Main Matrix Area */}
      <div className={`flex-1 space-y-4 transition-all duration-300 ${sidebarOpen ? "lg:mr-0" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-foreground">Eisenhower Matrix</h2>
            <p className="text-sm text-muted-foreground">
              Prioritize by urgency and importance
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto Sort Button */}
            {unassignedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={autoSortTasks}
                className="bg-secondary border-border hover:bg-secondary/80 gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Auto-sort ({unassignedCount})
              </Button>
            )}

            {/* Sidebar Toggle (Desktop) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`hidden lg:flex gap-2 transition-colors ${
                sidebarOpen 
                  ? "bg-foreground text-background hover:bg-foreground/90 border-transparent" 
                  : "bg-secondary border-border text-foreground hover:bg-secondary/80"
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              {sidebarOpen ? "Done Organizing" : "Organize Matrix"}
            </Button>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-2 gap-2">
          <QuadrantDropZone
            quadrant="do-first"
            tasks={tasksByQuadrant["do-first"]}
          />
          <QuadrantDropZone
            quadrant="schedule"
            tasks={tasksByQuadrant["schedule"]}
          />
          <QuadrantDropZone
            quadrant="delegate"
            tasks={tasksByQuadrant["delegate"]}
          />
          <QuadrantDropZone
            quadrant="eliminate"
            tasks={tasksByQuadrant["eliminate"]}
          />
        </div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:block overflow-hidden"
          >
            <div className="w-[280px] h-full rounded-xl glass-panel bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground">Tasks</h3>
                <Select
                  value={sidebarFilter}
                  onValueChange={(v) => setSidebarFilter(v as typeof sidebarFilter)}
                >
                  <SelectTrigger className="w-auto h-7 text-xs bg-secondary border-border">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-border">
                    <SelectItem value="unassigned">Unassigned ({unassignedCount})</SelectItem>
                    <SelectItem value="all">All Tasks</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                {sidebarTasks.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    {sidebarFilter === "unassigned" 
                      ? "All tasks are assigned to quadrants" 
                      : "No tasks match this filter"}
                  </div>
                ) : (
                  sidebarTasks.map((task) => (
                    <DraggableSidebarTask key={task.id} task={task} />
                  ))
                )}
              </div>

              {sidebarFilter === "unassigned" && unassignedCount > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={autoSortTasks}
                    className="w-full bg-secondary border-border hover:bg-secondary/80 gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Auto-sort All
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Sort tasks based on priority and due date
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
