"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Flag, Tag, Plus, X, Clock, AlignLeft, Link2, Timer } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import type { Priority, Quadrant } from "@/lib/types"
import { PRIORITY_INFO, getPriorityInfo, getQuadrantInfo } from "@/lib/types"

interface ManualTaskFormProps {
  onCancel?: () => void
}

export function ManualTaskForm({ onCancel }: ManualTaskFormProps) {
  const { addTask, settings } = useTasks()
  
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [dueTime, setDueTime] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [quadrant, setQuadrant] = useState<Quadrant>(null)
  const [recurringPattern, setRecurringPattern] = useState<"daily" | "weekly" | "monthly" | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [description, setDescription] = useState("")
  const [links, setLinks] = useState("")
  const [timeEstimate, setTimeEstimate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    let finalDueDate: Date | null = null
    if (dueDate) {
      finalDueDate = new Date(dueDate)
      if (dueTime) {
        const [hours, minutes] = dueTime.split(":").map(Number)
        finalDueDate.setHours(hours, minutes, 0, 0)
      }
    }

    addTask({
      title: title.trim(),
      dueDate: finalDueDate,
      priority,
      status: "todo",
      quadrant,
      recurringPattern,
      subtasks: [],
      tags,
      notes: "",
      description,
      links,
      timeEstimate,
      reminder: null,
    })

    // Reset form
    setTitle("")
    setDueDate(undefined)
    setDueTime("")
    setPriority("medium")
    setQuadrant(null)
    setTags([])
    setNewTag("")
    setDescription("")
    setLinks("")
    setTimeEstimate("")
    setRecurringPattern(null)
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

  return (
    <motion.form
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onSubmit={handleSubmit}
      className="rounded-xl glass p-4 space-y-4"
    >
      {/* Title */}
      <div className="space-y-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-secondary border-border focus:border-foreground/40 text-base"
          placeholder="What do you need to do?"
          autoFocus
        />
      </div>

      {/* Date, Time, Priority row */}
      <div className="flex flex-wrap gap-2">
        {/* Due Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-secondary border-border hover:bg-secondary/80"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {dueDate ? format(dueDate, "MMM d") : "Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover shadow-md border-border" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Time */}
        {dueDate && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary border border-border">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="bg-transparent border-0 h-auto p-0 w-20 text-sm focus-visible:ring-0"
            />
          </div>
        )}

        {/* Priority */}
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
          <SelectTrigger className="w-auto bg-secondary border-border h-8">
            <Flag className="w-4 h-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border shadow-md">
            {(Object.keys(PRIORITY_INFO) as Priority[]).map((value) => {
              const info = getPriorityInfo(value, settings)
              return (
                <SelectItem key={value} value={value}>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${info.color}`} />
                    {info.label}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        {/* Quadrant */}
        <Select
          value={quadrant || "none"}
          onValueChange={(v) => setQuadrant(v === "none" ? null : (v as Quadrant))}
        >
          <SelectTrigger className="w-auto bg-secondary border-border h-8">
            <SelectValue placeholder="Quadrant" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border shadow-md">
            <SelectItem value="none">No quadrant</SelectItem>
            {(["do-first", "schedule", "delegate", "eliminate"] as Quadrant[]).map((value) => {
              if (!value) return null
              const info = getQuadrantInfo(value, settings)!
              return (
                <SelectItem key={value} value={value}>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${info.color.replace("/10", "")}`} />
                    {info.label}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        {/* Recurring */}
        <Select
          value={recurringPattern || "none"}
          onValueChange={(v) => setRecurringPattern(v === "none" ? null : (v as "daily" | "weekly" | "monthly"))}
        >
          <SelectTrigger className="w-auto bg-secondary border-border h-8">
            <SelectValue placeholder="Recurring" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border shadow-md">
            <SelectItem value="none">Does not repeat</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-0.5 text-xs bg-secondary/80 text-muted-foreground rounded"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex items-center gap-1 flex-1 px-2 py-1 rounded-md bg-secondary border border-border">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              className="bg-transparent border-0 h-auto p-0 text-sm focus-visible:ring-0"
              placeholder="Add tag..."
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddTag}
            disabled={!newTag.trim()}
            className="bg-secondary border-border hover:bg-secondary/80"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Additional Fields (Optional) */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-secondary border-border focus:border-foreground/40 text-sm h-8"
            placeholder="Add description (optional)..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            className="bg-secondary border-border focus:border-foreground/40 text-sm h-8"
            placeholder="Add links (optional)..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={timeEstimate}
            onChange={(e) => setTimeEstimate(e.target.value)}
            className="bg-secondary border-border focus:border-foreground/40 text-sm h-8"
            placeholder="Time estimate (e.g., 2h) (optional)..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="bg-secondary border-border hover:bg-secondary/80"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={!title.trim()}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          Add Task
        </Button>
      </div>
    </motion.form>
  )
}
