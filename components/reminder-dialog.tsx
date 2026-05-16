"use client"

import { useState } from "react"
import { format, addMinutes, addHours, addDays } from "date-fns"
import { Bell, Calendar as CalendarIcon, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTasks } from "@/lib/task-context"
import type { Task } from "@/lib/types"

interface ReminderDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const quickOptions = [
  { label: "In 15 minutes", getValue: () => addMinutes(new Date(), 15) },
  { label: "In 1 hour", getValue: () => addHours(new Date(), 1) },
  { label: "In 3 hours", getValue: () => addHours(new Date(), 3) },
  { label: "Tomorrow 9am", getValue: () => {
    const tomorrow = addDays(new Date(), 1)
    tomorrow.setHours(9, 0, 0, 0)
    return tomorrow
  }},
]

export function ReminderDialog({ task, open, onOpenChange }: ReminderDialogProps) {
  const { setReminder } = useTasks()
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState("")

  const handleQuickOption = (getValue: () => Date) => {
    if (!task) return
    setReminder(task.id, getValue())
    onOpenChange(false)
  }

  const handleCustomReminder = () => {
    if (!task || !date) return
    
    const reminderDate = new Date(date)
    if (time) {
      const [hours, minutes] = time.split(":").map(Number)
      reminderDate.setHours(hours, minutes, 0, 0)
    } else {
      reminderDate.setHours(9, 0, 0, 0)
    }
    
    setReminder(task.id, reminderDate)
    onOpenChange(false)
  }

  const handleClearReminder = () => {
    if (!task) return
    setReminder(task.id, null)
    onOpenChange(false)
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Set Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current reminder */}
          {task.reminder && (
            <div className="p-3 rounded-lg bg-secondary text-sm">
              <span className="text-muted-foreground">Current reminder: </span>
              <span className="text-foreground">
                {format(new Date(task.reminder), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          )}

          {/* Quick options */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Quick Options</label>
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickOption(option.getValue)}
                  className="bg-secondary border-border hover:bg-secondary/80 text-sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom date/time */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Custom Date & Time</label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-secondary border-border hover:bg-secondary/80 text-left font-normal"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {date ? format(date, "MMM d") : "Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-secondary border-border focus:border-foreground/40"
                />
              </div>
            </div>
            <Button
              onClick={handleCustomReminder}
              disabled={!date}
              className="w-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
            >
              Set Custom Reminder
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {task.reminder && (
            <Button
              variant="outline"
              onClick={handleClearReminder}
              className="w-full sm:w-auto bg-secondary border-border hover:bg-secondary/80 text-red-400 hover:text-red-400"
            >
              Clear Reminder
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-secondary border-border hover:bg-secondary/80"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
