"use client"

import { useState } from "react"
import { Settings, Bell, Calendar, Trash2, Download, Grid2x2, Eye, Clock, Flag, Zap, Volume2, Pencil, Check } from "lucide-react"
import { useTasks } from "@/lib/task-context"
import { useGoogleLogin } from "@react-oauth/google"
import type { Priority, ViewType } from "@/lib/types"
import { PRIORITY_COLOR_OPTIONS, getPriorityInfo, PRIORITY_INFO } from "@/lib/types"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function SettingsPanel() {
  const { tasks, settings, updateSettings, autoSortTasks } = useTasks()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null)
  const [tempLabel, setTempLabel] = useState("")

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      localStorage.setItem("gcal_access_token", tokenResponse.access_token)
      updateSettings({ googleCalendarConnected: true })
    },
    onError: () => {
      console.error("Google Login Failed")
      updateSettings({ googleCalendarConnected: false })
    },
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks.readonly",
  })

  const handleClearAllTasks = () => {
    // Clear from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("task-tracker-data")
      window.location.reload()
    }
  }

  const handleExportData = () => {
    const data = {
      tasks,
      settings,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `task-tracker-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.tasks && Array.isArray(data.tasks)) {
          // Merge imported tasks with existing ones, overwriting duplicates
          const importedTasks = data.tasks as any[]
          const newTasks = [...tasks]
          
          importedTasks.forEach(importedTask => {
            const existingIndex = newTasks.findIndex(t => t.id === importedTask.id)
            if (existingIndex >= 0) {
              newTasks[existingIndex] = importedTask
            } else {
              newTasks.push(importedTask)
            }
          })
          
          localStorage.setItem("task-tracker-data", JSON.stringify(newTasks))
          if (data.settings) {
            localStorage.setItem("task-tracker-settings", JSON.stringify({ ...settings, ...data.settings }))
          }
          window.location.reload()
        }
      } catch (err) {
        console.error("Failed to parse imported data:", err)
        alert("Failed to import data. Invalid file format.")
      }
    }
    reader.readAsText(file)
    // reset input
    event.target.value = ""
  }

  const viewOptions: { value: ViewType; label: string }[] = [
    { value: "list", label: "List" },
    { value: "board", label: "Board" },
    { value: "calendar", label: "Calendar" },
    { value: "compact", label: "Compact" },
    { value: "matrix", label: "Matrix" },
  ]

  const priorityOptions: { value: Priority; label: string }[] = [
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ]

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent className="bg-background border-l border-border w-[380px] sm:w-[420px] sm:max-w-[420px] overflow-y-auto px-5">
          <SheetHeader>
            <SheetTitle className="text-foreground">Settings</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-6">

            {/* ---- Views ---- */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                Views
              </h3>
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Startup view</label>
                  <Select
                    value={settings.startupView}
                    onValueChange={(v) => updateSettings({ startupView: v as ViewType })}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {viewOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Show completed tasks</label>
                  <button
                    onClick={() => updateSettings({ showCompletedTasks: !settings.showCompletedTasks })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      settings.showCompletedTasks ? "bg-foreground" : "bg-muted"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-background absolute top-0.5 transition-all ${
                      settings.showCompletedTasks ? "left-5.5" : "left-0.5"
                    }`} />
                  </button>
                </div>
              </div>
            </section>

            <div className="h-px bg-[rgba(120,112,100,0.15)]" />

            {/* ---- Priority Options ---- */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Flag className="w-4 h-4 text-muted-foreground" />
                Priority Options
              </h3>
              <div className="space-y-3 pl-6">
                {(Object.keys(PRIORITY_INFO) as Priority[]).map((priority) => {
                  const info = getPriorityInfo(priority, settings)
                  const isEditing = editingPriority === priority

                  return (
                    <div key={priority} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        {isEditing ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              updateSettings({
                                customPriorityLabels: {
                                  ...(settings.customPriorityLabels || {}),
                                  [priority]: tempLabel.trim() || info.label,
                                },
                              })
                              setEditingPriority(null)
                            }}
                            className="flex items-center gap-2 flex-1"
                          >
                            <input
                              type="text"
                              value={tempLabel}
                              onChange={(e) => setTempLabel(e.target.value)}
                              className="bg-secondary border border-border rounded px-2 py-0.5 text-sm flex-1 max-w-[150px] focus:outline-none focus:ring-1 focus:ring-foreground"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <label className="text-sm text-muted-foreground capitalize">{info.label}</label>
                            <button
                              onClick={() => {
                                setEditingPriority(priority)
                                setTempLabel(info.label)
                              }}
                              className="text-muted-foreground/50 hover:text-foreground transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className={`w-5 h-5 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-foreground ml-4 ${info.color}`}
                            aria-label={`Select ${info.label} priority color`}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-3 bg-popover border-border" align="end">
                          <div className="flex flex-wrap gap-2">
                            {PRIORITY_COLOR_OPTIONS.map((color) => (
                              <button
                                key={color}
                                onClick={() => {
                                  updateSettings({
                                    customPriorityColors: {
                                      ...(settings.customPriorityColors || {}),
                                      [priority]: color,
                                    },
                                  })
                                }}
                                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 flex-shrink-0 ${color} ${
                                  info.color === color ? "ring-2 ring-offset-2 ring-foreground" : "opacity-80"
                                }`}
                                aria-label={`Set ${info.label} priority to ${color}`}
                              />
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )
                })}
              </div>
            </section>

            <div className="h-px bg-[rgba(120,112,100,0.15)]" />

            {/* ---- Task Defaults ---- */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Flag className="w-4 h-4 text-muted-foreground" />
                Task Defaults
              </h3>
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="text-sm text-muted-foreground">Auto-priority</label>
                    <span className="text-[10px] text-muted-foreground/70">Smartly infer priority from task context</span>
                  </div>
                  <button
                    onClick={() => updateSettings({ autoPriority: !settings.autoPriority })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      settings.autoPriority ? "bg-foreground" : "bg-muted"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-background absolute top-0.5 transition-all ${
                      settings.autoPriority ? "left-5.5" : "left-0.5"
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Default reminder</label>
                  <Select
                    value={settings.defaultReminderMinutes.toString()}
                    onValueChange={(v) => updateSettings({ defaultReminderMinutes: parseInt(v) })}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <div className="h-px bg-[rgba(120,112,100,0.15)]" />

            {/* ---- Matrix ---- */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Grid2x2 className="w-4 h-4 text-muted-foreground" />
                Eisenhower Matrix
              </h3>
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-muted-foreground block">Auto-assign quadrant</label>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Place tasks in matrix automatically</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ autoAssignQuadrant: !settings.autoAssignQuadrant })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      settings.autoAssignQuadrant ? "bg-foreground" : "bg-muted"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-background absolute top-0.5 transition-all ${
                      settings.autoAssignQuadrant ? "left-5.5" : "left-0.5"
                    }`} />
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={autoSortTasks}
                  className="w-full bg-secondary border-border hover:bg-secondary/80 gap-2 justify-start"
                >
                  <Zap className="w-4 h-4" />
                  Re-sort all tasks now
                </Button>
              </div>
            </section>

            <div className="h-px bg-[rgba(120,112,100,0.15)]" />

            {/* ---- Notifications ---- */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                Notifications
              </h3>
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Enable notifications</label>
                  <button
                    onClick={() => {
                      if (!settings.notificationsEnabled && typeof Notification !== "undefined") {
                        Notification.requestPermission()
                      }
                      updateSettings({ notificationsEnabled: !settings.notificationsEnabled })
                    }}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      settings.notificationsEnabled ? "bg-foreground" : "bg-muted"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-background absolute top-0.5 transition-all ${
                      settings.notificationsEnabled ? "left-5.5" : "left-0.5"
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5" />
                    Play notification sound
                  </label>
                  <button
                    onClick={() => updateSettings({ notificationSoundEnabled: !settings.notificationSoundEnabled })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      settings.notificationSoundEnabled ? "bg-foreground" : "bg-muted"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-background absolute top-0.5 transition-all ${
                      settings.notificationSoundEnabled ? "left-5.5" : "left-0.5"
                    }`} />
                  </button>
                </div>
              </div>
            </section>

            <div className="h-px bg-[rgba(120,112,100,0.15)]" />

            {/* ---- Integrations ---- */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Integrations
              </h3>
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-muted-foreground block">Google Calendar</label>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      {settings.googleCalendarConnected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (settings.googleCalendarConnected) {
                        localStorage.removeItem("gcal_access_token")
                        updateSettings({ googleCalendarConnected: false })
                      } else {
                        googleLogin()
                      }
                    }}
                    className={`text-xs ${
                      settings.googleCalendarConnected
                        ? "bg-foreground text-background hover:bg-foreground/90 border-transparent"
                        : "bg-secondary border-border hover:bg-secondary/80"
                    }`}
                  >
                    {settings.googleCalendarConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>
            </section>

            <div className="h-px bg-[rgba(120,112,100,0.15)]" />

            {/* ---- Data ---- */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Download className="w-4 h-4 text-muted-foreground" />
                Data Backup & Recovery
              </h3>
              <div className="space-y-2 pl-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="w-full bg-secondary border-border hover:bg-secondary/80 gap-2 justify-start"
                >
                  <Download className="w-4 h-4" />
                  Export all data
                </Button>
                
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-secondary border-border hover:bg-secondary/80 gap-2 justify-start pointer-events-none"
                  >
                    <Download className="w-4 h-4 rotate-180" />
                    Import data
                  </Button>
                </div>
                
                <p className="text-[11px] text-muted-foreground/60">
                  {tasks.length} tasks stored locally
                </p>
              </div>
            </section>



            {/* ---- Danger Zone ---- */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-red-400/80 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Danger Zone
              </h3>
              <div className="pl-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-secondary border-border hover:bg-red-500/10 gap-2 justify-start text-red-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete all tasks
                </Button>
              </div>
            </section>

          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all tasks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {tasks.length} tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary/80 border-border hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllTasks}
              className="bg-red-500/80 hover:bg-red-500 text-white border-transparent"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
