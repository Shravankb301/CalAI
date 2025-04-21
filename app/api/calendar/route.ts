import { NextResponse } from 'next/server'
import { parseCommand } from '@/utils/calendarCommands'
import { APIResponse, toAPIEvent } from '@/types/calendar'

export async function POST(request: Request) {
  const command = await request.text()
  const parsedCommand = parseCommand(command)

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
} 