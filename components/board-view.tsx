"use client"

import { useMemo } from "react"
import { useTasks } from "@/lib/task-context"
import type { Task, Status } from "@/lib/types"
import { BoardTaskCard } from "./board-task-card"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

const COLUMNS: { status: Status; label: string }[] = [
  { status: "todo", label: "To Do" },
  { status: "in-progress", label: "In Progress" },
  { status: "done", label: "Done" },
]

interface BoardColumnProps {
  status: Status
  label: string
  tasks: Task[]
}

function BoardColumn({ status, label, tasks }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks])

  return (
    <div
      ref={setNodeRef}
      className={`glass rounded-xl p-3 flex flex-col transition-colors ${
        isOver ? "bg-secondary/50 ring-2 ring-foreground/20" : ""
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto min-h-[100px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8 opacity-50">
              No tasks
            </div>
          ) : (
            tasks.map((task) => (
              <BoardTaskCard key={task.id} task={task} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

export function BoardView() {
  const { tasks, settings } = useTasks()

  const tasksByStatus = useMemo(() => {
    const map: Record<Status, Task[]> = {
      "todo": [],
      "in-progress": [],
      "done": [],
    }
    tasks.forEach((task) => {
      if (!settings.showCompletedTasks && task.status === "done") return
      if (map[task.status]) {
        map[task.status].push(task)
      }
    })
    return map
  }, [tasks, settings.showCompletedTasks])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
      {COLUMNS.map((col) => (
        <BoardColumn 
          key={col.status}
          status={col.status}
          label={col.label}
          tasks={tasksByStatus[col.status]}
        />
      ))}
    </div>
  )
}
