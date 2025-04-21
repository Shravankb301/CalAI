// Base event interface with common fields
export interface BaseEvent {
  title: string
  description?: string
}

// Event with Date objects (for internal use)
export interface CalendarEvent extends BaseEvent {
  id: string
  start: Date
  end: Date
}

// Event with ISO strings (for API communication)
export interface APIEvent extends BaseEvent {
  id?: string
  start: string
  end: string
}

// Command parsing result
export interface ParsedCommand {
  action: 'add' | 'remove' | 'update' | 'view'
  event?: Omit<CalendarEvent, 'id'>  // id is generated after parsing
  error?: string
}

// API response format
export interface APIResponse {
  action: 'add' | 'remove' | 'update' | 'view'
  event?: APIEvent
  error?: string
}

// Utility functions to convert between types
export const toAPIEvent = (event: CalendarEvent): APIEvent => ({
  id: event.id,
  title: event.title,
  start: event.start.toISOString(),
  end: event.end.toISOString(),
  description: event.description,
})

export const toCalendarEvent = (event: APIEvent): CalendarEvent => ({
  id: event.id || crypto.randomUUID(),
  title: event.title,
  start: new Date(event.start),
  end: new Date(event.end),
  description: event.description,
}) 