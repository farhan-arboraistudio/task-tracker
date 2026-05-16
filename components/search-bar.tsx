"use client"

import { useState } from "react"
import { Search, X, Eye, EyeOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  hideCompleted: boolean
  onToggleHideCompleted: () => void
}

export function SearchBar({ value, onChange, hideCompleted, onToggleHideCompleted }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors duration-200 ${
          isFocused ? "bg-[rgba(60,57,52,0.5)]" : "bg-secondary"
        }`}
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search tasks..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange("")}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={onToggleHideCompleted}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors duration-200 text-sm ${
          hideCompleted
            ? "bg-[rgba(60,57,52,0.5)] text-foreground"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        {hideCompleted ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {hideCompleted ? "Show completed" : "Hide completed"}
        </span>
      </button>
    </div>
  )
}
