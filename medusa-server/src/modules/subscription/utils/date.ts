export const toValidDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

export const toIsoString = (value: string | Date) => {
  const date = toValidDate(value)
  return date ? date.toISOString() : new Date().toISOString()
}

export const addMonths = (value: string | Date, months: number) => {
  const date = toValidDate(value) || new Date()
  const next = new Date(date)
  next.setMonth(next.getMonth() + Math.max(0, Math.round(months || 0)))
  return next.toISOString()
}

export const isPast = (value: string | Date, comparedTo?: string | Date) => {
  const target = toValidDate(value)
  const pivot = comparedTo ? toValidDate(comparedTo) : new Date()

  if (!target || !pivot) {
    return false
  }

  return target.getTime() <= pivot.getTime()
}

export const getRemainingTime = (value: string | Date, comparedTo?: string | Date) => {
  const target = toValidDate(value)
  const pivot = comparedTo ? toValidDate(comparedTo) : new Date()

  if (!target || !pivot) {
    return {
      remaining_ms: 0,
      remaining_days: 0,
      remaining_hours: 0,
    }
  }

  const remaining = Math.max(0, target.getTime() - pivot.getTime())
  const remainingDays = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const remainingHours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  return {
    remaining_ms: remaining,
    remaining_days: remainingDays,
    remaining_hours: remainingHours,
  }
}

