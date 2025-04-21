import { addDays, addHours, startOfDay } from 'date-fns'
import { parse } from 'date-fns'
import { ParsedCommand } from '@/types/calendar'

export function parseCommand(input: string): ParsedCommand {
  const lowerCommand = input.toLowerCase()
  
  // Basic command parsing
  if (lowerCommand.includes('add') || lowerCommand.includes('schedule')) {
    return parseAddCommand(input)
  } else if (lowerCommand.includes('remove') || lowerCommand.includes('delete')) {
    return { action: 'remove' }
  } else if (lowerCommand.includes('update') || lowerCommand.includes('change')) {
    return { action: 'update' }
  } else if (lowerCommand.includes('view') || lowerCommand.includes('show')) {
    return { action: 'view' }
  }
  
  return {
    action: 'add',
    error: 'Could not understand command'
  }
}

function parseAddCommand(command: string): ParsedCommand {
  // Simple implementation - can be enhanced with more sophisticated NLP
  const now = new Date()
  const tomorrow = addDays(now, 1)
  const startTime = startOfDay(tomorrow)
  
  // Extract title (everything before time-related words)
  const titleMatch = command.match(/(.*?)(?:at|on|tomorrow|today)/i)
  const title = titleMatch ? titleMatch[1].trim() : 'New Event'
  
  // Extract time (after "at")
  const timeMatch = command.match(/at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i)
  let start = new Date(startTime)
  let end = new Date(startTime)
  
  if (timeMatch) {
    const timeStr = timeMatch[1]
    const [hours, minutes = '00'] = timeStr.split(':')
    const isPM = timeStr.toLowerCase().includes('pm')
    
    let hour = parseInt(hours)
    if (isPM && hour < 12) hour += 12
    if (!isPM && hour === 12) hour = 0
    
    start.setHours(hour, parseInt(minutes), 0, 0)
    end.setHours(hour + 1, parseInt(minutes), 0, 0)
  } else {
    end.setHours(start.getHours() + 1)
  }
  
  return {
    action: 'add',
    event: {
      title,
      start,
      end,
    }
  }
} 