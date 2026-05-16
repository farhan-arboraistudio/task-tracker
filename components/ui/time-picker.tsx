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

  const hourRef = React.useRef<HTMLButtonElement | null>(null)
  const minuteRef = React.useRef<HTMLButtonElement | null>(null)

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
  }, [value])

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        hourRef.current?.scrollIntoView({ block: "center" })
        minuteRef.current?.scrollIntoView({ block: "center" })
      }, 0)
    }
  }, [isOpen])

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
      <PopoverContent className="w-auto p-3 bg-popover border-border">
        <div className="flex gap-2">
          {/* Hours */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground text-center mb-1">Hour</span>
            <div className="h-40 overflow-y-auto flex flex-col gap-1 pr-1">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                const str = h.toString().padStart(2, "0")
                return (
                  <Button
                    key={str}
                    ref={hour === str ? hourRef : null}
                    variant={hour === str ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-10 h-8",
                      hour === str && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => {
                      setHour(str)
                      handleApply(str, minute, ampm)
                    }}
                  >
                    {str}
                  </Button>
                )
              })}
            </div>
          </div>
          {/* Minutes */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground text-center mb-1">Min</span>
            <div className="h-40 overflow-y-auto flex flex-col gap-1 pr-1">
              {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => {
                return (
                  <Button
                    key={m}
                    ref={minute === m ? minuteRef : null}
                    variant={minute === m ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-10 h-8",
                      minute === m && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => {
                      setMinute(m)
                      handleApply(hour, m, ampm)
                    }}
                  >
                    {m}
                  </Button>
                )
              })}
            </div>
          </div>
          {/* AM/PM */}
          <div className="flex flex-col gap-1">
             <span className="text-xs text-muted-foreground text-center mb-1">AM/PM</span>
             <div className="flex flex-col gap-1">
                <Button
                    variant={ampm === "AM" ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-12 h-8",
                      ampm === "AM" && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => {
                      setAmpm("AM")
                      handleApply(hour, minute, "AM")
                    }}
                  >
                    AM
                </Button>
                <Button
                    variant={ampm === "PM" ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-12 h-8",
                      ampm === "PM" && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => {
                      setAmpm("PM")
                      handleApply(hour, minute, "PM")
                    }}
                  >
                    PM
                </Button>
             </div>
             <Button 
                variant="ghost" 
                size="sm" 
                className="mt-auto text-xs text-red-500 hover:bg-red-500/10 hover:text-red-500"
                onClick={() => onChange("")}
             >
                Clear
             </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
