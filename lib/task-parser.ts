import * as chrono from "chrono-node"
import { addDays } from "date-fns"
import type { ParsedTask, Priority } from "./types"
import { PRIORITY_KEYWORDS, WORK_DAYS } from "./types"

function getNextWorkDay(from: Date): Date {
  let date = from
  let attempts = 0
  while (!WORK_DAYS.includes(date.getDay()) && attempts < 7) {
    date = addDays(date, 1)
    attempts++
  }
  return date
}

function extractPriority(text: string): { priority: Priority; cleanedText: string; isExplicit: boolean } {
  let priority: Priority = "medium"
  let cleanedText = text
  let isExplicit = false

  for (const [keyword, p] of Object.entries(PRIORITY_KEYWORDS)) {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi")
    if (regex.test(text)) {
      priority = p
      cleanedText = cleanedText.replace(regex, "").trim()
      isExplicit = true
      break
    }
  }

  return { priority, cleanedText, isExplicit }
}

function extractTags(text: string): { tags: string[]; cleanedText: string } {
  const tagRegex = /#(\w+)/g
  const tags: string[] = []
  let match

  while ((match = tagRegex.exec(text)) !== null) {
    tags.push(match[1].toLowerCase())
  }

  const cleanedText = text.replace(tagRegex, "").trim()
  return { tags, cleanedText }
}

export function parseTaskInput(input: string): ParsedTask {
  // First extract tags
  const { tags, cleanedText: textWithoutTags } = extractTags(input)

  // Then extract priority
  const { priority, cleanedText: textWithoutPriority, isExplicit: isPriorityExplicit } = extractPriority(textWithoutTags)

  // Parse date with chrono (using casual parser directly)
  const parsedDate = chrono.parse(textWithoutPriority, new Date(), {
    forwardDate: true,
  })

  let dueDate: Date | null = null
  let title = textWithoutPriority

  if (parsedDate.length > 0) {
    const firstResult = parsedDate[0]
    dueDate = firstResult.start.date()

    // Remove the date text from the title
    const dateText = firstResult.text
    title = title.replace(dateText, "").trim()
  }

  // Clean up extra spaces
  title = title.replace(/\s+/g, " ").trim()

  // Capitalise the first letter of the words
  title = title.replace(/\b\w/g, (char) => char.toUpperCase())

  return {
    title: title || input,
    dueDate,
    priority,
    isPriorityExplicit: isPriorityExplicit,
    tags,
  }
}

// Helper to format time nicely
export function formatDueDate(date: Date | null): string {
  if (!date) return "No due date"

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = addDays(today, 1)
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0

  if (dateOnly.getTime() === today.getTime()) {
    return hasTime ? `Today at ${timeStr}` : "Today"
  }

  if (dateOnly.getTime() === tomorrow.getTime()) {
    return hasTime ? `Tomorrow at ${timeStr}` : "Tomorrow"
  }

  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return hasTime ? `${dateStr} at ${timeStr}` : dateStr
}
