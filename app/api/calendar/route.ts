import { NextResponse } from 'next/server'
import { parseCommand } from '@/utils/calendarCommands'
import { APIResponse, toAPIEvent } from '@/types/calendar'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    if (!body || typeof body.message !== 'string') {
      return NextResponse.json({ 
        action: 'error',
        error: 'Invalid request: message is required'
      })
    }
    
    const { message } = body
    const parsedCommand = parseCommand(message)

    const response: APIResponse = {
      action: parsedCommand.action,
      error: parsedCommand.error,
    }

    if (parsedCommand.event) {
      // Generate a new ID and convert to API format
      response.event = toAPIEvent({
        id: crypto.randomUUID(),
        ...parsedCommand.event,
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json({ 
      action: 'error',
      error: 'Failed to process calendar command'
    })
  }
} 