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

  // Pre-process common shorthands and invalid times before chrono
  let preProcessedText = textWithoutPriority
    .replace(/\bthe day after tomorrow\b/gi, "the day after tomorrow")
    .replace(/\bday after tomorrow\b/gi, "the day after tomorrow")
    .replace(/\bthe day after\b/gi, "tomorrow")
    .replace(/\bday after\b/gi, "tomorrow")
    .replace(/\btom\b/gi, "tomorrow")
    .replace(/\btod\b/gi, "today")
    // Replace something like "13pm" or "14pm" with "13:00" or "14:00"
    .replace(/\b([0-9]{2})\s*pm\b/gi, (match, hour) => {
      const h = parseInt(hour, 10)
      if (h > 12 && h <= 24) {
        return `${h}:00`
      }
      return match
    })

  // Parse date with chrono (using casual parser directly)
  const parsedDate = chrono.parse(preProcessedText, new Date(), {
    forwardDate: true,
  })

  let dueDate: Date | null = null
  let title = textWithoutPriority // Use original text for title to preserve user's actual input if no date is found

  if (parsedDate.length > 0) {
    const firstResult = parsedDate[0]
    dueDate = firstResult.start.date()

    // Remove the date text from the title
    // We need to remove the matched date text from the *original* text without priority.
    // However, since chrono matched against preProcessedText, its text output might be "tomorrow" instead of "tom".
    // We can just remove the exact string `firstResult.text` if it exists, or remove the word based on index.
    // To be safe and simple, we'll strip known shorthands too if the parsed text is exactly that.
    title = title
      .replace(firstResult.text, "")
      .replace(/\bthe day after tomorrow\b/gi, "")
      .replace(/\bday after tomorrow\b/gi, "")
      .replace(/\bthe day after\b/gi, "")
      .replace(/\bday after\b/gi, "")
      .replace(/\btom\b/gi, "")
      .replace(/\btod\b/gi, "")
      // also replace the matched time if it was 13pm etc.
      .replace(/\b([0-9]{2})\s*pm\b/gi, "")
      .trim()
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
