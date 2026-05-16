import * as React from "react"
import { Clock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string // "HH:mm" 24-hour
  onChange: (value: string) => void
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [hour, setHour] = React.useState("12")
  const [minute, setMinute] = React.useState("00")
  const [ampm, setAmpm] = React.useState<"AM" | "PM">("AM")
  const [isOpen, setIsOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"hour" | "minute">("hour")

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(":")
      let hourNum = parseInt(h, 10)
      if (hourNum >= 12) {
        setAmpm("PM")
        if (hourNum > 12) hourNum -= 12
      } else {
        setAmpm("AM")
        if (hourNum === 0) hourNum = 12
      }
      setHour(hourNum.toString().padStart(2, "0"))
      setMinute(m)
    }
  }, [value, isOpen])

  const handleApply = (h: string, m: string, ap: string) => {
    let hourNum = parseInt(h, 10)
    if (ap === "PM" && hourNum < 12) hourNum += 12
    if (ap === "AM" && hourNum === 12) hourNum = 0
    const val = `${hourNum.toString().padStart(2, "0")}:${m}`
    onChange(val)
  }

  const displayTime = value ? `${hour}:${minute} ${ampm}` : "Select time"

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-secondary border-border hover:bg-secondary/80",
            !value && "text-muted-foreground"
          )}
        >
          {displayTime}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-4 bg-popover border-border">
        <div className="flex flex-col gap-4">
          
          {/* Top Bar: Time Display & AM/PM */}
          <div className="flex items-center justify-between">
             <div className="flex items-baseline gap-1">
                <button 
                  onClick={() => setMode("hour")}
                  className={cn("text-2xl font-bold rounded px-1 transition-colors hover:bg-secondary", mode === "hour" ? "text-primary" : "text-muted-foreground")}
                >
                  {hour}
                </button>
                <span className="text-xl font-bold text-muted-foreground">:</span>
                <button 
                  onClick={() => setMode("minute")}
                  className={cn("text-2xl font-bold rounded px-1 transition-colors hover:bg-secondary", mode === "minute" ? "text-primary" : "text-muted-foreground")}
                >
                  {minute}
                </button>
             </div>
             <div className="flex bg-secondary p-0.5 rounded-md">
                <button
                  onClick={() => { setAmpm("AM"); handleApply(hour, minute, "AM"); }}
                  className={cn("px-2 py-1 text-xs font-medium rounded-sm transition-colors", ampm === "AM" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                >
                  AM
                </button>
                <button
                  onClick={() => { setAmpm("PM"); handleApply(hour, minute, "PM"); }}
                  className={cn("px-2 py-1 text-xs font-medium rounded-sm transition-colors", ampm === "PM" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                >
                  PM
                </button>
             </div>
          </div>

          {/* Grid View */}
          {mode === "hour" ? (
             <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => {
                   const str = h.toString().padStart(2, "0")
                   const isSelected = hour === str
                   return (
                      <Button
                        key={str}
                        variant={isSelected ? "default" : "outline"}
                        className={cn("h-10 w-full font-medium", isSelected && "bg-primary text-primary-foreground")}
                        onClick={() => {
                           setHour(str)
                           handleApply(str, minute, ampm)
                           setMode("minute") // Auto-switch to minutes
                        }}
                      >
                         {str}
                      </Button>
                   )
                })}
             </div>
          ) : (
             <div className="grid grid-cols-4 gap-2">
                {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => {
                   const isSelected = minute === m
                   return (
                      <Button
                        key={m}
                        variant={isSelected ? "default" : "outline"}
                        className={cn("h-10 w-full font-medium", isSelected && "bg-primary text-primary-foreground")}
                        onClick={() => {
                           setMinute(m)
                           handleApply(hour, m, ampm)
                           setIsOpen(false) // Auto-close on minute select
                        }}
                      >
                         {m}
                      </Button>
                   )
                })}
             </div>
          )}

          <div className="flex justify-between pt-2 border-t border-border mt-1">
             <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-7"
                onClick={() => { onChange(""); setIsOpen(false); }}
             >
                Clear
             </Button>
             <Button 
                variant="default" 
                size="sm" 
                className="text-xs h-7 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setIsOpen(false)}
             >
                Done
             </Button>
          </div>

        </div>
      </PopoverContent>
    </Popover>
  )
}
