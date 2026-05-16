"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import type { Settings, Priority, ViewType } from "./types"

interface SettingsContextType {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
  exportData: () => string
  importData: (data: string) => boolean
}

const defaultSettings: Settings = {
  workDays: [0, 1, 2, 3], // Sunday through Wednesday
  defaultPriority: "medium",
  defaultView: "list",
  notificationsEnabled: false,
  defaultReminderMinutes: 30,
}

const SettingsContext = createContext<SettingsContextType | null>(null)

const SETTINGS_KEY = "task-tracker-settings"

function loadSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (!stored) return defaultSettings
    return { ...defaultSettings, ...JSON.parse(stored) }
  } catch {
    return defaultSettings
  }
}

function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loaded = loadSettings()
    setSettings(loaded)
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      saveSettings(settings)
    }
  }, [settings, isLoaded])

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  const exportData = useCallback(() => {
    const tasks = localStorage.getItem("task-tracker-data") || "[]"
    const exportObj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      tasks: JSON.parse(tasks),
    }
    return JSON.stringify(exportObj, null, 2)
  }, [settings])

  const importData = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data)
      if (parsed.tasks) {
        localStorage.setItem("task-tracker-data", JSON.stringify(parsed.tasks))
      }
      if (parsed.settings) {
        setSettings((prev) => ({ ...prev, ...parsed.settings }))
      }
      window.location.reload()
      return true
    } catch {
      return false
    }
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        exportData,
        importData,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
