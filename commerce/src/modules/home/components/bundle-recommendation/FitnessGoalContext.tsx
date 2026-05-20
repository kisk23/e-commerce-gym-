"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"

type FitnessGoal = "bulk" | "cut" | "maintenance" | "performance" | "general" | null

type FitnessGoalContextType = {
  selectedGoal: FitnessGoal
  setSelectedGoal: (goal: FitnessGoal) => void
  showOverlay: boolean
  setShowOverlay: (show: boolean) => void
  openOverlay: () => void
  closeOverlay: () => void
}

const FitnessGoalContext = createContext<FitnessGoalContextType | undefined>(
  undefined
)

const SESSION_STORAGE_KEY = "fitness_goal_selected"

export function FitnessGoalProvider({ children }: { children: ReactNode }) {
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if user has already selected a goal in this session
    const sessionGoal = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (sessionGoal) {
      setSelectedGoal(sessionGoal as FitnessGoal)
      setShowOverlay(false)
    } else {
      // Show overlay on first visit
      setShowOverlay(true)
    }
  }, [])

  const handleSetSelectedGoal = useCallback((goal: FitnessGoal) => {
    setSelectedGoal(goal)
    if (goal) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, goal)
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [])

  const openOverlay = useCallback(() => {
    setShowOverlay(true)
  }, [])

  const closeOverlay = useCallback(() => {
    setShowOverlay(false)
  }, [])

  const contextValue = {
    selectedGoal,
    setSelectedGoal: handleSetSelectedGoal,
    showOverlay: mounted ? showOverlay : false,
    setShowOverlay,
    openOverlay,
    closeOverlay,
  }

  return (
    <FitnessGoalContext.Provider value={contextValue}>
      {children}
    </FitnessGoalContext.Provider>
  )
}

export function useFitnessGoal() {
  const context = useContext(FitnessGoalContext)
  if (context === undefined) {
    console.error("useFitnessGoal must be used within a FitnessGoalProvider")
    // Return default values to prevent crash
    return {
      selectedGoal: null,
      setSelectedGoal: () => {},
      showOverlay: false,
      setShowOverlay: () => {},
      openOverlay: () => {},
      closeOverlay: () => {},
    }
  }
  return context
}
