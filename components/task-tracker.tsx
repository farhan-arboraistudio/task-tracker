"use client"

import { useState, useCallback, useEffect } from "react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { TaskProvider, useTasks } from "@/lib/task-context"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { useNotifications } from "@/hooks/use-notifications"
import { SmartInput } from "./smart-input"
import { TaskList } from "./task-list"
import { BoardView } from "./board-view"
import { CompactView } from "./compact-view"
import { EisenhowerMatrix } from "./eisenhower-matrix"
import { CalendarView } from "./calendar-view"
import { SettingsPanel } from "./settings-panel"
import { ThemeToggle } from "./theme-toggle"
import { AnimatePresence, motion } from "framer-motion"
import type { Task, Quadrant, ViewType } from "@/lib/types"
import {
  List,
  LayoutGrid,
  Calendar as CalendarIcon,
  AlignJustify,
  Columns3,
  ChevronDown,
  Grid2x2,
} from "lucide-react"

const VIEW_OPTIONS: { value: Exclude<ViewType, "matrix" | "calendar">; label: string; icon: React.ReactNode }[] = [
  { value: "list", label: "List", icon: <List className="w-4 h-4" /> },
  { value: "board", label: "Board", icon: <Columns3 className="w-4 h-4" /> },
  { value: "compact", label: "Compact", icon: <AlignJustify className="w-4 h-4" /> },
]

const ALL_VIEW_MAP: Record<ViewType, { label: string; icon: React.ReactNode }> = {
  list: { label: "List", icon: <List className="w-4 h-4" /> },
  board: { label: "Board", icon: <Columns3 className="w-4 h-4" /> },
  calendar: { label: "Calendar", icon: <CalendarIcon className="w-4 h-4" /> },
  compact: { label: "Compact", icon: <AlignJustify className="w-4 h-4" /> },
  matrix: { label: "Matrix", icon: <Grid2x2 className="w-4 h-4" /> },
}

function TaskTrackerContent() {
  const {
    tasks,
    viewUsage,
    trackViewUsage,
    moveToQuadrant,
    reorderTask,
    updateStatus,
    autoSortTasks,
    settings,
    isLoaded,
  } = useTasks()
  const [view, setView] = useState<ViewType>("list")
  const [lastNonMatrixView, setLastNonMatrixView] = useState<Exclude<ViewType, "matrix" | "calendar">>("list")
  const [showViewPicker, setShowViewPicker] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Mount notification system
  useNotifications()

  // Set startup view from settings on first load
  useEffect(() => {
    if (isLoaded && !initialized && settings.startupView) {
      setView(settings.startupView)
      if (settings.startupView !== "matrix" && settings.startupView !== "calendar") {
        setLastNonMatrixView(settings.startupView as Exclude<ViewType, "matrix" | "calendar">)
      }
      setInitialized(true)
    }
  }, [isLoaded, settings.startupView, initialized])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleViewChange = useCallback((newView: ViewType) => {
    if (newView !== "matrix" && newView !== "calendar") {
      setLastNonMatrixView(newView as Exclude<ViewType, "matrix" | "calendar">)
    }
    setView(newView)
    trackViewUsage(newView)
  }, [trackViewUsage])

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id)
      if (task) setActiveTask(task)
    },
    [tasks]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveTask(null)

      if (!over || active.id === over.id) return

      const overId = over.id as string
      const quadrants: Quadrant[] = ["do-first", "schedule", "delegate", "eliminate"]
      const statuses: string[] = ["todo", "in-progress", "done"]

      // If dropped directly onto a quadrant background
      if (quadrants.includes(overId as Quadrant)) {
        moveToQuadrant(active.id as string, overId as Quadrant)
      } else if (overId === "unassigned") {
        moveToQuadrant(active.id as string, null)
      } else if (statuses.includes(overId)) {
        updateStatus(active.id as string, overId as any)
      } else {
        // If dropped onto another task, reorder and sync quadrant/status
        reorderTask(active.id as string, overId)
      }
    },
    [moveToQuadrant, updateStatus, reorderTask]
  )

  const isMatrix = view === "matrix"
  const currentViewOption = VIEW_OPTIONS.find((v) => v.value === view)
  const lastViewInfo = ALL_VIEW_MAP[lastNonMatrixView]

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
          {/* Header */}
          <header className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Task Tracker
              </h1>
              <p className="text-muted-foreground mt-1">
                Organize your work with smart task management
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <SettingsPanel />
            </div>
          </header>

          {/* Smart Input */}
          <SmartInput />

          {/* View Navigation */}
          <div className="flex items-center gap-2 mt-6 mb-4">
            {/* View Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowViewPicker(!showViewPicker)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  !isMatrix
                    ? "glass shadow-[0_0_20px_rgba(210,205,195,0.05)] text-foreground"
                    : "bg-[rgba(45,43,40,0.3)] text-muted-foreground hover:text-foreground"
                }`}
              >
                {currentViewOption ? currentViewOption.icon : <List className="w-4 h-4" />}
                <span>{currentViewOption ? currentViewOption.label : "View"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showViewPicker ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showViewPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowViewPicker(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1.5 z-50 rounded-xl p-1.5 min-w-[160px] bg-popover border border-border shadow-md"
                    >
                      {VIEW_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            handleViewChange(option.value)
                            setShowViewPicker(false)
                          }}
                          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all ${
                            view === option.value && !isMatrix
                              ? "bg-foreground text-background font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Matrix / Back Toggle */}
            <button
              onClick={() => handleViewChange(isMatrix ? lastNonMatrixView : "matrix")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isMatrix
                  ? "glass shadow-[0_0_20px_rgba(210,205,195,0.05)] text-foreground"
                  : "bg-[rgba(45,43,40,0.3)] text-muted-foreground hover:text-foreground"
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={isMatrix ? "back" : "matrix"}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  {isMatrix ? (
                    <>
                      {lastViewInfo.icon}
                      {lastViewInfo.label}
                    </>
                  ) : (
                    <>
                      <Grid2x2 className="w-4 h-4" />
                      Matrix
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* Calendar Toggle */}
            <button
              onClick={() => handleViewChange(view === "calendar" ? lastNonMatrixView : "calendar")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                view === "calendar"
                  ? "glass shadow-[0_0_20px_rgba(210,205,195,0.05)] text-foreground"
                  : "bg-[rgba(45,43,40,0.3)] text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </button>
          </div>

          {/* Main Content */}
          <main>
            {view === "list" ? (
              <TaskList />
            ) : view === "board" ? (
              <BoardView />
            ) : view === "calendar" ? (
              <CalendarView />
            ) : view === "compact" ? (
              <CompactView />
            ) : (
              <EisenhowerMatrix />
            )}
          </main>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask && (
          <div className="glass rounded-xl p-3 shadow-xl">
            <p className="text-sm text-foreground">{activeTask.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export function TaskTracker() {
  console.log("CLIENT ID IS:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "no-client-id"}>
      <TaskProvider>
        <TaskTrackerContent />
      </TaskProvider>
    </GoogleOAuthProvider>
  )
}
