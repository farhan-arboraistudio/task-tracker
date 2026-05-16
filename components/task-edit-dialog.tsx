"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Flag, Tag, Plus, X, FileText, Clock, AlignLeft, Link2, Timer } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTasks } from "@/lib/task-context"
import type { Task, Priority, Status, Quadrant } from "@/lib/types"
import { PRIORITY_INFO, STATUS_INFO, QUADRANT_INFO } from "@/lib/types"

interface TaskEditDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskEditDialog({ task, open, onOpenChange }: TaskEditDialogProps) {
  const { updateTask, addSubtask, deleteSubtask, toggleSubtask } = useTasks()
  
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [dueTime, setDueTime] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [status, setStatus] = useState<Status>("todo")
  const [quadrant, setQuadrant] = useState<Quadrant>(null)
  const [notes, setNotes] = useState("")
  const [description, setDescription] = useState("")
  const [links, setLinks] = useState("")
  const [timeEstimate, setTimeEstimate] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [newSubtask, setNewSubtask] = useState("")
  const [recurringPattern, setRecurringPattern] = useState<"daily" | "weekly" | "monthly" | null>(null)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
      setDueTime(task.dueDate ? format(new Date(task.dueDate), "HH:mm") : "")
      setPriority(task.priority)
      setStatus(task.status)
      setQuadrant(task.quadrant)
      setNotes(task.notes || "")
      setDescription(task.description || "")
      setLinks(task.links || "")
      setTimeEstimate(task.timeEstimate || "")
      setTags(task.tags)
      setRecurringPattern(task.recurringPattern || null)
    }
  }, [task])

  const handleSave = () => {
    if (!task) return

    let finalDueDate: Date | null = null
    if (dueDate) {
      finalDueDate = new Date(dueDate)
      if (dueTime) {
        const [hours, minutes] = dueTime.split(":").map(Number)
        finalDueDate.setHours(hours, minutes, 0, 0)
      }
    }

    updateTask(task.id, {
      title,
      dueDate: finalDueDate,
      priority,
      status,
      quadrant,
      notes,
      description,
      links,
      timeEstimate,
      tags,
      recurringPattern,
    })
    onOpenChange(false)
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleAddSubtask = () => {
    if (newSubtask.trim() && task) {
      addSubtask(task.id, newSubtask.trim())
      setNewSubtask("")
    }
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover border-border max-w-xl max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary border-border focus:border-foreground/40"
              placeholder="Task title"
            />
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Due Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-secondary border-border hover:bg-secondary/80 text-left font-normal"
                  >
                    {dueDate ? format(dueDate, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time
              </label>
              <Input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="bg-secondary border-border focus:border-foreground/40"
              />
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Priority
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {Object.entries(PRIORITY_INFO).map(([value, info]) => (
                    <SelectItem key={value} value={value}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${info.color}`} />
                        {info.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {Object.entries(STATUS_INFO).map(([value, info]) => (
                    <SelectItem key={value} value={value}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quadrant & Recurring */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Matrix Quadrant</label>
              <Select
                value={quadrant || "none"}
                onValueChange={(v) => setQuadrant(v === "none" ? null : (v as Quadrant))}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="No quadrant" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="none">No quadrant</SelectItem>
                  {Object.entries(QUADRANT_INFO).map(([value, info]) => (
                    <SelectItem key={value} value={value}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Recurring</label>
              <Select
                value={recurringPattern || "none"}
                onValueChange={(v) => setRecurringPattern(v === "none" ? null : (v as "daily" | "weekly" | "monthly"))}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Not recurring" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="none">Not recurring</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-secondary/80 text-muted-foreground rounded"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                className="bg-secondary border-border focus:border-foreground/40"
                placeholder="Add tag..."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                className="bg-secondary border-border hover:bg-secondary/80"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-xs text-muted-foreground mr-1 self-center">Presets:</span>
              {["work", "personal", "health", "errands"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    if (!tags.includes(preset)) setTags([...tags, preset])
                  }}
                  className="px-2 py-0.5 text-xs bg-[rgba(60,57,52,0.4)] text-muted-foreground hover:text-foreground rounded transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <AlignLeft className="w-4 h-4" />
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border focus:border-foreground/40 min-h-[60px]"
              placeholder="Add description..."
            />
          </div>

          {/* Links & Time Estimate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Links
              </label>
              <Input
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                className="bg-secondary border-border focus:border-foreground/40"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Time Estimate
              </label>
              <Input
                value={timeEstimate}
                onChange={(e) => setTimeEstimate(e.target.value)}
                className="bg-secondary border-border focus:border-foreground/40"
                placeholder="e.g. 2h 30m"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary border-border focus:border-foreground/40 min-h-[60px]"
              placeholder="Add notes..."
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Subtasks</label>
            <div className="space-y-1">
              {task.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 p-2 rounded bg-secondary"
                >
                  <button
                    onClick={() => toggleSubtask(task.id, subtask.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      subtask.completed
                        ? "bg-foreground border-foreground"
                        : "border-muted-foreground"
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
                      subtask.completed ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask(task.id, subtask.id)}
                    className="text-muted-foreground hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSubtask())}
                className="bg-secondary border-border focus:border-foreground/40"
                placeholder="Add subtask..."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSubtask}
                className="bg-secondary border-border hover:bg-secondary/80"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-secondary border-border hover:bg-secondary/80"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-foreground text-background hover:bg-foreground/90">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
