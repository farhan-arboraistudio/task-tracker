"use client"

import { useEffect, useRef } from "react"
import { useTasks } from "@/lib/task-context"

export function useNotifications() {
  const { tasks, settings } = useTasks()
  const notifiedTasks = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!settings.notificationsEnabled || typeof window === "undefined" || !("Notification" in window)) {
      return
    }

    if (Notification.permission !== "granted") {
      return
    }

    const interval = setInterval(() => {
      const now = new Date()
      const currentMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()).getTime()

      tasks.forEach((task) => {
        if (task.status === "done") return
        if (notifiedTasks.current.has(task.id)) return

        let shouldNotify = false
        let notificationBody = ""

        // Check custom reminder
        if (task.reminder) {
          const reminderTime = new Date(task.reminder)
          const reminderMinute = new Date(reminderTime.getFullYear(), reminderTime.getMonth(), reminderTime.getDate(), reminderTime.getHours(), reminderTime.getMinutes()).getTime()
          
          if (reminderMinute === currentMinute) {
            shouldNotify = true
            notificationBody = "Reminder: " + task.title
          }
        }

        // Check due date with default reminder offset
        if (!shouldNotify && task.dueDate && settings.defaultReminderMinutes > 0) {
          const dueTime = new Date(task.dueDate)
          const offsetTime = new Date(dueTime.getTime() - settings.defaultReminderMinutes * 60000)
          const offsetMinute = new Date(offsetTime.getFullYear(), offsetTime.getMonth(), offsetTime.getDate(), offsetTime.getHours(), offsetTime.getMinutes()).getTime()
          
          if (offsetMinute === currentMinute) {
            shouldNotify = true
            notificationBody = `Due in ${settings.defaultReminderMinutes} minutes: ` + task.title
          }
        }

        if (shouldNotify) {
          new Notification("Task Tracker", {
            body: notificationBody,
            icon: "/favicon.ico",
          })
          
          if (settings.notificationSoundEnabled) {
            try {
              // Creating a simple oscillator beep instead of relying on an external file
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
              const osc = ctx.createOscillator()
              const gain = ctx.createGain()
              osc.connect(gain)
              gain.connect(ctx.destination)
              osc.type = "sine"
              osc.frequency.setValueAtTime(880, ctx.currentTime) // A5 note
              gain.gain.setValueAtTime(0.1, ctx.currentTime)
              osc.start()
              gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5)
              osc.stop(ctx.currentTime + 0.5)
            } catch (e) {
              console.error("Audio playback failed", e)
            }
          }

          notifiedTasks.current.add(task.id)
        }
      })
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [tasks, settings.notificationsEnabled, settings.defaultReminderMinutes])

  return null
}
