export async function syncTaskToGoogleCalendar(task: any, accessToken: string) {
  if (!task.dueDate) return null

  const event = {
    summary: task.title,
    description: `Status: ${task.status}\nPriority: ${task.priority}\n${task.notes || ""}`,
    start: {
      dateTime: new Date(task.dueDate).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString(), // Assume 1 hour duration
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  }

  try {
    const url = task.gcalEventId
      ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.gcalEventId}`
      : "https://www.googleapis.com/calendar/v3/calendars/primary/events"
      
    const method = task.gcalEventId ? "PUT" : "POST"

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      console.error("Failed to sync with Google Calendar", await response.text())
      return null
    }

    const data = await response.json()
    return data.id // Returns the event ID
  } catch (e) {
    console.error("Error syncing to Google Calendar:", e)
    return null
  }
}

export async function deleteFromGoogleCalendar(eventId: string, accessToken: string) {
  try {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (e) {
    console.error("Error deleting from Google Calendar:", e)
  }
}

export async function fetchGoogleTasks(accessToken: string) {
  try {
    // 1. Fetch all task lists
    const listsRes = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    
    if (!listsRes.ok) {
      console.error("Failed to fetch task lists", await listsRes.text())
      return []
    }
    
    const listsData = await listsRes.json()
    const lists = listsData.items || []

    // 2. Fetch tasks for each list concurrently
    const allTasks: any[] = []
    const fetchPromises = lists.map(async (list: any) => {
      const tasksRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?maxResults=100&showCompleted=false&showHidden=true`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        if (tasksData.items) {
          allTasks.push(...tasksData.items)
        }
      }
    })

    await Promise.all(fetchPromises)
    return allTasks
  } catch (e) {
    console.error("Error fetching Google Tasks:", e)
    return []
  }
}
