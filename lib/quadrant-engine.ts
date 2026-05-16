import type { Priority, Quadrant, Task } from "./types"

/**
 * Smart quadrant inference engine.
 * Analyzes task title, priority, due date, tags, and contextual keywords
 * to determine the best Eisenhower quadrant placement.
 */

// ---- Keyword categories for importance inference ----
const HIGH_IMPORTANCE_KEYWORDS = [
  // Work & professional
  "meeting", "presentation", "deadline", "client", "boss", "manager",
  "interview", "review", "report", "proposal", "contract", "launch",
  "deploy", "release", "production", "deliver", "submit", "exam",
  "test", "assignment", "project", "strategy", "budget", "audit",
  // Health & essential
  "doctor", "dentist", "hospital", "medication", "medicine", "health",
  "insurance", "tax", "rent", "mortgage", "bill", "payment", "bank",
  // Daily essentials
  "grocery", "groceries", "milk", "food", "cook", "meal", "lunch",
  "dinner", "breakfast", "water", "medicine",
  // Family & responsibilities
  "school", "pickup", "drop off", "kids", "children", "family",
  "parent", "appointment", "visa", "passport", "registration",
  // Fitness & wellbeing
  "gym", "workout", "exercise", "run", "jog",
]

const LOW_IMPORTANCE_KEYWORDS = [
  // Entertainment & leisure
  "movie", "netflix", "game", "gaming", "browse", "scroll",
  "social media", "youtube", "tiktok", "instagram", "twitter",
  "reddit", "meme", "fun", "hang out", "chill",
  // Optional tasks
  "maybe", "someday", "consider", "think about", "look into",
  "explore", "research later", "nice to have", "optional",
  "if time", "when free", "eventually", "reorganize", "declutter",
  "sort through",
]

const DELEGATABLE_KEYWORDS = [
  "order", "buy online", "schedule", "book", "reserve", "renew",
  "cancel subscription", "unsubscribe", "follow up", "remind",
  "send email", "reply", "forward", "share", "post", "upload",
  "download", "backup", "update app", "install",
]

/**
 * Calculates an urgency score (0-1) based on due date proximity.
 * 0 = not urgent at all, 1 = extremely urgent / overdue
 */
function calculateUrgencyScore(dueDate: Date | null): number {
  if (!dueDate) return 0.3 // No date = moderate default urgency
  
  const now = new Date()
  const hoursUntilDue = (new Date(dueDate).getTime() - now.getTime()) / (1000 * 60 * 60)
  
  if (hoursUntilDue < 0) return 1.0          // Overdue
  if (hoursUntilDue < 3) return 0.95          // Due in < 3 hours
  if (hoursUntilDue < 12) return 0.85         // Due today
  if (hoursUntilDue < 24) return 0.75         // Due tomorrow
  if (hoursUntilDue < 48) return 0.6          // Due in 2 days
  if (hoursUntilDue < 72) return 0.45         // Due in 3 days
  if (hoursUntilDue < 168) return 0.3         // Due this week
  if (hoursUntilDue < 336) return 0.2         // Due in 2 weeks
  return 0.1                                   // Far future
}

/**
 * Calculates an importance score (0-1) based on title keywords,
 * tags, and explicit priority.
 */
function calculateImportanceScore(
  title: string,
  priority: Priority,
  tags: string[]
): number {
  const titleLower = title.toLowerCase()
  const allText = `${titleLower} ${tags.join(" ").toLowerCase()}`
  
  // Start with priority-based baseline
  let score: number
  switch (priority) {
    case "urgent": score = 0.95; break
    case "high": score = 0.8; break
    case "medium": score = 0.5; break
    case "low": score = 0.25; break
  }
  
  // Boost for high-importance keywords
  const highMatches = HIGH_IMPORTANCE_KEYWORDS.filter((kw) => allText.includes(kw))
  score += highMatches.length * 0.12
  
  // Reduce for low-importance keywords
  const lowMatches = LOW_IMPORTANCE_KEYWORDS.filter((kw) => allText.includes(kw))
  score -= lowMatches.length * 0.15
  
  // Work-related tags boost
  const workTags = ["work", "job", "office", "client", "project", "school", "uni", "college"]
  const hasWorkTag = tags.some((t) => workTags.includes(t.toLowerCase()))
  if (hasWorkTag) score += 0.15
  
  // Personal daily essentials - boost to medium-high importance
  const essentialPatterns = [
    /\b(buy|get|pick up|grab)\b.*\b(milk|groceries|food|medicine|water)\b/i,
    /\b(pay|submit|file)\b.*\b(rent|bill|tax|report)\b/i,
    /\b(call|visit|see)\b.*\b(doctor|dentist|bank|lawyer)\b/i,
  ]
  if (essentialPatterns.some((p) => p.test(title))) {
    score = Math.max(score, 0.65)
  }
  
  return Math.max(0, Math.min(1, score))
}

/**
 * Check if a task is likely delegatable based on its nature
 */
function isDelegatable(title: string, tags: string[]): boolean {
  const allText = `${title.toLowerCase()} ${tags.join(" ").toLowerCase()}`
  return DELEGATABLE_KEYWORDS.some((kw) => allText.includes(kw))
}

/**
 * Infers the best Eisenhower quadrant for a task using multiple signals:
 * - Due date proximity (urgency)
 * - Title keyword analysis (importance)
 * - Explicit priority level
 * - Tag context
 * - Delegatability
 */
export function inferQuadrant(task: {
  title: string
  dueDate: Date | null
  priority: Priority
  tags: string[]
}): { quadrant: Quadrant; inferredPriority: Priority } {
  const urgency = calculateUrgencyScore(task.dueDate)
  const importance = calculateImportanceScore(task.title, task.priority, task.tags)
  
  const isUrgent = urgency >= 0.55
  const isImportant = importance >= 0.5

  // Check for delegatable tasks
  const canDelegate = isDelegatable(task.title, task.tags)
  
  if (isUrgent && isImportant) {
    return { quadrant: "do-first", inferredPriority: "urgent" }
  } else if (!isUrgent && isImportant) {
    return { quadrant: "schedule", inferredPriority: "high" }
  } else if (isUrgent && !isImportant) {
    return { quadrant: "delegate", inferredPriority: "medium" }
  } else {
    // Not urgent and not important
    if (canDelegate && urgency >= 0.3) {
      return { quadrant: "delegate", inferredPriority: "medium" }
    }
    return { quadrant: "eliminate", inferredPriority: "low" }
  }
}

/**
 * Get urgency level for visual hue (0-4 scale)
 * 0 = no urgency, 4 = critical
 */
export function getUrgencyLevel(task: Task): number {
  if (task.status === "done") return 0
  
  const now = new Date()
  
  if (!task.dueDate) {
    // No due date: base on priority alone
    switch (task.priority) {
      case "urgent": return 3
      case "high": return 2
      case "medium": return 1
      default: return 0
    }
  }
  
  const hoursLeft = (new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60)
  
  if (hoursLeft < 0) return 4          // Overdue
  if (hoursLeft < 6) return 3          // Due very soon
  if (hoursLeft < 24) return 2         // Due today
  if (hoursLeft < 48) return 1         // Due tomorrow
  return 0                              // Plenty of time
}
