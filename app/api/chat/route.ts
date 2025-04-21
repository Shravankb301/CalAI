import { NextResponse } from 'next/server'
import { parseCommand } from '@/utils/calendarCommands'
import { APIResponse } from '@/types/calendar'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    
    // Parse the command to determine if it's a calendar operation
    const parsedCommand = parseCommand(message)
    
    // If it's a calendar command, forward it to the calendar API
    if (parsedCommand.action) {
      const calendarResponse = await fetch(`${request.headers.get('origin')}/api/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      
      if (!calendarResponse.ok) {
        throw new Error('Failed to process calendar command')
      }
      
      const calendarData: APIResponse = await calendarResponse.json()
      
      if (calendarData.error) {
        return NextResponse.json({ 
          response: `Sorry, I couldn't process that: ${calendarData.error}` 
        })
      }
      
      // Generate appropriate response based on the action
      let response = ''
      switch (calendarData.action) {
        case 'add':
          response = `I've added "${calendarData.event?.title}" to your calendar.`
          break
        case 'remove':
          response = "I've removed the event from your calendar."
          break
        case 'update':
          response = `I've updated the event "${calendarData.event?.title}" in your calendar.`
          break
        case 'view':
          response = 'Here are your upcoming events...' // This would need more implementation
          break
      }
      
      return NextResponse.json({ response })
    }
    
    // If it's not a calendar command, provide a helpful response
    return NextResponse.json({ 
      response: "I can help you manage your calendar. Try saying things like 'add meeting tomorrow at 2pm' or 'what's on my schedule today?'" 
    })
    
  } catch (error) {
    console.error('Error processing chat message:', error)
    return NextResponse.json({ 
      response: 'Sorry, I encountered an error. Please try again.' 
    })
  }
} 