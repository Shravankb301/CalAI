import { NextResponse } from 'next/server'
import { APIEvent } from '@/types/calendar'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    
    // Process the message to extract event information
    const events: APIEvent[] = []
    let response = ''
    
    // Example: "Add a meeting with John at 2pm tomorrow"
    const timeRegex = /(?:at|from)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
    const dateRegex = /(?:on|tomorrow|today|next\s+\w+day)/i
    const durationRegex = /(?:for|lasting)\s+(\d+)\s*(?:hour|hr|minute|min)/i
    
    const hasTime = timeRegex.test(message)
    const hasDate = dateRegex.test(message)
    
    if (hasTime || hasDate) {
      // Extract event details
      const title = message.split(/(?:at|from|on|tomorrow|today|next\s+\w+day)/i)[0].trim()
      const timeMatch = message.match(timeRegex)
      const dateMatch = message.match(dateRegex)
      const durationMatch = message.match(durationRegex)
      
      // Calculate start and end times
      const now = new Date()
      let startDate = new Date(now)
      
      if (dateMatch) {
        const dateStr = dateMatch[0].toLowerCase()
        if (dateStr === 'tomorrow') {
          startDate.setDate(startDate.getDate() + 1)
        } else if (dateStr.startsWith('next')) {
          const day = dateStr.split(' ')[1]
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          const targetDay = days.indexOf(day)
          const currentDay = startDate.getDay()
          const daysToAdd = (targetDay - currentDay + 7) % 7
          startDate.setDate(startDate.getDate() + daysToAdd)
        }
      }
      
      if (timeMatch) {
        const timeStr = timeMatch[1]
        const [hours, minutes] = timeStr.split(':').map(Number)
        const isPM = timeStr.toLowerCase().includes('pm')
        
        startDate.setHours(isPM ? hours + 12 : hours)
        startDate.setMinutes(minutes || 0)
      }
      
      let endDate = new Date(startDate)
      if (durationMatch) {
        const duration = parseInt(durationMatch[1])
        const unit = durationMatch[0].toLowerCase().includes('hour') ? 'hour' : 'minute'
        endDate.setTime(startDate.getTime() + (unit === 'hour' ? duration * 60 * 60 * 1000 : duration * 60 * 1000))
      } else {
        // Default 1-hour duration if not specified
        endDate.setTime(startDate.getTime() + 60 * 60 * 1000)
      }
      
      const event: APIEvent = {
        title,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
      
      events.push(event)
      response = `I've added "${title}" to your calendar ${dateMatch ? 'on ' + dateMatch[0] : ''} ${timeMatch ? 'at ' + timeMatch[1] : ''}.`
    } else {
      response = "I couldn't find any event details in your message. Could you please specify a time and date for the event?"
    }
    
    return NextResponse.json({ events, response })
  } catch (error) {
    console.error('Error processing message:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
} 