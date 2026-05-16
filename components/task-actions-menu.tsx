"use client"

import { useState } from "react"
import {
  MoreHorizontal,
  Pencil,
  Copy,
  ArrowRightCircle,
  Bell,
  Trash2,
  Target,
  ArrowRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTasks } from "@/lib/task-context"
import type { Task, Quadrant } from "@/lib/types"
import { QUADRANT_INFO } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TaskActionsMenuProps {
  task: Task
  onEdit: () => void
  onSetReminder: () => void
  onOpenChange?: (open: boolean) => void
}

export function TaskActionsMenu({ task, onEdit, onSetReminder, onOpenChange }: TaskActionsMenuProps) {
  const { deleteTask, duplicateTask, carryForward, moveToQuadrant } = useTasks()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const quadrants: Quadrant[] = ["do-first", "schedule", "delegate", "eliminate"]

  return (
    <>
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 rounded hover:bg-[rgba(70,66,60,0.5)] text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-[#252320] border-[rgba(120,112,100,0.2)]">
          <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer">
            <Pencil className="w-4 h-4" />
            Edit Task
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => duplicateTask(task.id)} className="gap-2 cursor-pointer">
            <Copy className="w-4 h-4" />
            Duplicate
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => carryForward(task.id)} className="gap-2 cursor-pointer">
            <ArrowRightCircle className="w-4 h-4" />
            Carry Forward
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onSetReminder} className="gap-2 cursor-pointer">
            <Bell className="w-4 h-4" />
            Set Reminder
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-[rgba(70,66,60,0.5)]" />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
              <Target className="w-4 h-4" />
              Move to Quadrant
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-[#252320] border-[rgba(120,112,100,0.2)]">
              {quadrants.map((q) => {
                const info = QUADRANT_INFO[q]
                return (
                  <DropdownMenuItem
                    key={q}
                    onClick={() => moveToQuadrant(task.id, q)}
                    className="gap-2 cursor-pointer"
                  >
                    <div className={`w-2 h-2 rounded-full ${info.color.replace("/10", "")}`} />
                    {info.label}
                  </DropdownMenuItem>
                )
              })}
              {task.quadrant && (
                <>
                  <DropdownMenuSeparator className="bg-[rgba(70,66,60,0.5)]" />
                  <DropdownMenuItem
                    onClick={() => moveToQuadrant(task.id, null)}
                    className="gap-2 cursor-pointer text-muted-foreground"
                  >
                    Remove from Matrix
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator className="bg-[rgba(70,66,60,0.5)]" />

          <DropdownMenuItem
            onClick={() => setShowDeleteConfirm(true)}
            className="gap-2 cursor-pointer text-red-400 focus:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            Delete Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-[#252320] border-[rgba(120,112,100,0.2)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{task.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[rgba(55,52,48,0.5)] border-[rgba(120,112,100,0.2)] hover:bg-[rgba(70,66,60,0.5)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTask(task.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
