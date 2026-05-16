"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Filter,
  X,
  Calendar,
  Flag,
  CheckSquare,
  ArrowUpDown,
  Tag,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Priority, Status, SortField, SortDirection, FilterState } from "@/lib/types"
import { PRIORITY_INFO, STATUS_INFO } from "@/lib/types"

interface FilterBarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  sortField: SortField
  sortDirection: SortDirection
  onSortChange: (field: SortField, direction: SortDirection) => void
  availableTags: string[]
}

const QUICK_FILTERS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "Overdue", value: "overdue" },
]

export function FilterBar({
  filters,
  onFiltersChange,
  sortField,
  sortDirection,
  onSortChange,
  availableTags,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.priority !== "all") count++
    if (filters.status !== "all") count++
    if (filters.dateRange !== "all") count++
    if (filters.tags.length > 0) count++
    if (filters.hideCompleted) count++
    return count
  }, [filters])

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: "",
      priority: "all",
      status: "all",
      dateRange: "all",
      tags: [],
      hideCompleted: false,
    })
  }

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag]
    updateFilter("tags", newTags)
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      onSortChange(field, sortDirection === "asc" ? "desc" : "asc")
    } else {
      onSortChange(field, "asc")
    }
  }

  return (
    <div className="space-y-3">
      {/* Main Search Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search tasks..."
            className="pl-9 bg-secondary border-border focus:border-foreground/40"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`bg-secondary border-border hover:bg-secondary/80 gap-2 ${
            activeFilterCount > 0 ? "text-foreground" : ""
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-foreground text-background text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {QUICK_FILTERS.map((qf) => (
          <button
            key={qf.value}
            onClick={() =>
              updateFilter("dateRange", filters.dateRange === qf.value ? "all" : qf.value as FilterState["dateRange"])
            }
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              filters.dateRange === qf.value
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            {qf.label}
          </button>
        ))}

        <button
          onClick={() => updateFilter("hideCompleted", !filters.hideCompleted)}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
            filters.hideCompleted
              ? "bg-foreground text-background"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
        >
          Hide Completed
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="px-3 py-1.5 text-xs rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pt-2">
              {/* Priority Filter */}
              <Select
                value={filters.priority}
                onValueChange={(v) => updateFilter("priority", v as Priority | "all")}
              >
                <SelectTrigger className="w-auto bg-secondary border-border h-8 text-xs">
                  <Flag className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-secondary border-border">
                  <SelectItem value="all">All Priorities</SelectItem>
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

              {/* Status Filter */}
              <Select
                value={filters.status}
                onValueChange={(v) => updateFilter("status", v as Status | "all")}
              >
                <SelectTrigger className="w-auto bg-secondary border-border h-8 text-xs">
                  <CheckSquare className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-secondary border-border">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_INFO).map(([value, info]) => (
                    <SelectItem key={value} value={value}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <Select
                value={filters.dateRange}
                onValueChange={(v) => updateFilter("dateRange", v as FilterState["dateRange"])}
              >
                <SelectTrigger className="w-auto bg-secondary border-border h-8 text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent className="bg-secondary border-border">
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="noDate">No Date</SelectItem>
                </SelectContent>
              </Select>

              {/* Tags Filter */}
              {availableTags.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 bg-secondary border-border hover:bg-secondary/80 text-xs"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      Tags
                      {filters.tags.length > 0 && (
                        <span className="ml-1 w-4 h-4 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center">
                          {filters.tags.length}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2 bg-secondary border-border" align="start">
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
                            filters.tags.includes(tag)
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Sort */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 bg-secondary border-border hover:bg-secondary/80 text-xs"
                  >
                    <ArrowUpDown className="w-3 h-3 mr-1" />
                    Sort
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2 bg-secondary border-border" align="start">
                  <div className="space-y-1">
                    {[
                      { field: "dueDate" as SortField, label: "Due Date" },
                      { field: "priority" as SortField, label: "Priority" },
                      { field: "createdAt" as SortField, label: "Created" },
                      { field: "title" as SortField, label: "Title" },
                    ].map(({ field, label }) => (
                      <button
                        key={field}
                        onClick={() => toggleSort(field)}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-between ${
                          sortField === field
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                        }`}
                      >
                        {label}
                        {sortField === field && (
                          <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
