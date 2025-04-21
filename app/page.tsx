'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { Button } from '@/components/ui/button'
import { Settings, Plus, Send, Calendar as CalendarIcon, Bot, User, X } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { CalendarEvent, APIEvent, APIResponse, toCalendarEvent } from '@/types/calendar'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS
  }
})

const calendarStyles = {
  height: '100%',
  backgroundColor: 'transparent',
  border: 'none',
  fontFamily: 'inherit',
  '.rbcHeader': {
    padding: '1rem 0',
    fontWeight: '600',
    textTransform: 'none',
    borderBottom: 'none',
  },
  '.rbcTimeHeader': {
    borderRadius: '0.75rem 0.75rem 0 0',
    backgroundColor: 'var(--muted)',
    borderColor: 'var(--border)',
  },
  '.rbcTimeContent': {
    borderRadius: '0 0 0.75rem 0.75rem',
    backgroundColor: 'var(--card)',
    borderColor: 'var(--border)',
  },
  '.rbcTimeView': {
    border: 'none',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
  '.rbcToday': {
    backgroundColor: 'var(--muted)',
  },
  '.rbcCurrentTimeIndicator': {
    backgroundColor: 'var(--primary)',
  },
  '.rbcEvent': {
    backgroundColor: 'var(--primary)',
    borderRadius: '0.5rem',
    border: 'none',
    padding: '0.25rem 0.5rem',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    '&:hover': {
      transform: 'scale(1.02)',
    },
  },
  '.rbcTimeSlot': {
    color: 'var(--muted-foreground)',
  },
  '.rbcTimeslotGroup': {
    borderColor: 'var(--border)',
  },
  '.rbcTimeGutter .rbcTimeslotGroup': {
    borderColor: 'transparent',
  },
}

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string; timestamp?: Date }[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || isSending) return

    try {
      setIsSending(true)
      setChatHistory(prev => [...prev, { role: 'user', content: trimmedMessage, timestamp: new Date() }])
      setMessage('')

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedMessage }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response, timestamp: new Date() }])
    } catch (error) {
      console.error('Error sending message:', error)
      setChatHistory(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.', 
          timestamp: new Date() 
        }
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleSelectSlot = async (slotInfo: { start: Date; end: Date }) => {
    try {
      const title = prompt('Enter event title:')
      if (!title) return

      setIsLoading(true)
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          event: {
            title,
            start: slotInfo.start.toISOString(),
            end: slotInfo.end.toISOString(),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create event')
      }

      const data: APIResponse = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

      if (data.event) {
        const newEvent: CalendarEvent = {
          id: crypto.randomUUID(),
          title: data.event.title,
          start: new Date(data.event.start),
          end: new Date(data.event.end),
          description: data.event.description,
        }
        setEvents([...events, newEvent])
        setChatHistory([
          ...chatHistory,
          { role: 'assistant', content: `Event "${title}" has been added to your calendar.` },
        ])
      }
    } catch (error) {
      console.error('Error creating event:', error)
      setChatHistory([
        ...chatHistory,
        { role: 'assistant', content: `Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}` },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  const handleEventClose = () => {
    setSelectedEvent(null)
  }

  const handleEventDelete = async (event: CalendarEvent) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          event: {
            title: event.title,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            description: event.description,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      const data: APIResponse = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

      setEvents(events.filter(e => e.id !== event.id))
      setSelectedEvent(null)
      setChatHistory([
        ...chatHistory,
        { role: 'assistant', content: `Event "${event.title}" has been deleted.` },
      ])
    } catch (error) {
      console.error('Error deleting event:', error)
      setChatHistory([
        ...chatHistory,
        { role: 'assistant', content: `Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}` },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // ... rest of the function ...
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b">
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Smart Scheduler
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                {format(new Date(), 'EEEE, MMMM d')}
              </div>
              <Button variant="ghost" size="icon" className="hover:bg-muted rounded-lg">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 h-[calc(100vh-7rem)]">
          {/* Chat Section */}
          <div className="w-96 flex flex-col bg-card rounded-xl shadow-lg border overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30">
              <h2 className="text-lg font-semibold text-primary">Chat</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-2 items-start',
                    msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {msg.role === 'assistant' ? (
                      <Bot className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'rounded-xl px-3 py-2 max-w-[80%]',
                      msg.role === 'assistant'
                        ? 'bg-muted/50'
                        : 'bg-primary text-primary-foreground'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.timestamp && (
                      <p className="text-[10px] mt-1 opacity-60">
                        {format(msg.timestamp, 'PPp')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex gap-2 items-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-xl px-3 py-2 bg-muted/50">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex gap-2"
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isSending}
                />
                <Button type="submit" size="icon" disabled={!message.trim() || isSending}>
                  {isSending ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Event Details Modal */}
          {selectedEvent && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                  <Button variant="ghost" size="icon" onClick={handleEventClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Time</p>
                    <p className="text-sm">{format(selectedEvent.start, 'PPpp')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Time</p>
                    <p className="text-sm">{format(selectedEvent.end, 'PPpp')}</p>
                  </div>
                  {selectedEvent.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm">{selectedEvent.description}</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="destructive" onClick={() => handleEventDelete(selectedEvent)}>
                    Delete Event
                  </Button>
                  <Button onClick={handleEventClose}>Close</Button>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Section */}
          <div className="flex-1">
            <div className="bg-card rounded-xl shadow-lg border overflow-hidden h-full">
              <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-primary">Calendar</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 rounded-lg"
                    onClick={() => handleSelectSlot({ 
                      start: new Date(), 
                      end: new Date(Date.now() + 3600000) 
                    })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Event
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(), 'MMMM yyyy')}
                </div>
              </div>
              <div className="p-4 h-[calc(100%-4rem)]">
                <BigCalendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={calendarStyles}
                  defaultView="week"
                  views={['month', 'week', 'day']}
                  step={60}
                  timeslots={1}
                  selectable
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleEventSelect}
                  tooltipAccessor={event => `${event.title}\n${format(event.start, 'PPp')} - ${format(event.end, 'PPp')}`}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
