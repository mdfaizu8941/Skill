import { format, formatDistanceToNow, parseISO } from 'date-fns'

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return format(date, 'MMM d, yyyy')
  } catch {
    return ''
  }
}

export const formatRelative = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return ''
  }
}

export const formatTime = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return format(date, 'h:mm a')
  } catch {
    return ''
  }
}

export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const truncate = (str, length = 50) => {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '…' : str
}
