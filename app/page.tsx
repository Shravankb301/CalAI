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
  rbcHeader: {
    padding: '1.25rem 0',
    fontWeight: '600',
    textTransform: 'none',
    borderBottom: '1px solid var(--border)',
    color: 'var(--foreground)',
    fontSize: '0.95rem',
  },
  rbcTimeHeader: {
    backgroundColor: 'var(--card)',
    borderColor: 'var(--border)',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  rbcTimeContent: {
    backgroundColor: 'var(--card)',
    borderColor: 'var(--border)',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--border) transparent',
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'var(--border)',
      borderRadius: '3px',
    },
    '& > * + * > *': {
      borderLeft: '1px solid var(--border)',
    },
  },
  rbcTimeView: {
    border: '1px solid var(--border)',
    borderRadius: '1rem',
    overflow: 'hidden',
    backgroundColor: 'var(--card)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  rbcToday: {
    backgroundColor: 'var(--muted)',
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      height: '2px',
      background: 'var(--primary)',
      opacity: '0.5',
    },
  },
  rbcCurrentTimeIndicator: {
    backgroundColor: 'var(--primary)',
    height: '3px',
    boxShadow: '0 0 4px var(--primary)',
  },
  rbcEvent: {
    backgroundColor: 'var(--primary)',
    borderRadius: '0.5rem',
    border: 'none',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease-in-out',
    opacity: '0.9',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      opacity: '1',
      transform: 'scale(1.02)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)',
    },
  },
  rbcTimeSlot: {
    color: 'var(--muted-foreground)',
    fontSize: '0.875rem',
    borderTop: '1px solid var(--border)',
    padding: '0.5rem 0.75rem',
    '&:hover': {
      backgroundColor: 'var(--muted)',
    },
  },
  rbcTimeslotGroup: {
    borderBottom: '1px solid var(--border)',
    minHeight: '90px',
  },
  rbcTimeGutter: {
    borderRight: '1px solid var(--border)',
    paddingRight: '0.75rem',
  },
  rbcTimeColumn: {
    borderLeft: '1px solid var(--border)',
  },
  rbcDaySlot: {
    borderTop: '1px solid var(--border)',
    opacity: '0.8',
  },
  rbcTimeHeaderContent: {
    borderLeft: '1px solid var(--border)',
  },
  rbcTimeHeaderGutter: {
    backgroundColor: 'var(--card)',
  },
  rbcTime: {
    backgroundColor: 'var(--card)',
  },
  rbcDayBg: {
    backgroundColor: 'var(--card)',
  },
  rbcOffRangeBg: {
    backgroundColor: 'var(--muted)',
    opacity: '0.3',
  },
  rbcOffRange: {
    color: 'var(--muted-foreground)',
    opacity: '0.5',
  },
  rbcToolbar: {
    padding: '1rem',
    borderBottom: '1px solid var(--border)',
    marginBottom: '0',
    button: {
      color: 'var(--foreground)',
      borderColor: 'var(--border)',
      backgroundColor: 'transparent',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        backgroundColor: 'var(--muted)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)',
        transform: 'translateY(-1px)',
      },
      '&.rbcActive': {
        backgroundColor: 'var(--primary)',
        borderColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          backgroundColor: 'var(--primary)',
          borderColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
          transform: 'translateY(-1px)',
        },
      },
    },
  },
  '@media': {
    '(maxWidth: 768px)': {
      rbcTimeSlot: {
        padding: '0.25rem 0.5rem',
        fontSize: '0.75rem',
      },
      rbcEvent: {
        padding: '0.25rem 0.5rem',
        fontSize: '0.75rem',
      },
      rbcHeader: {
        padding: '0.75rem 0',
        fontSize: '0.85rem',
      },
    },
  },
}

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    {
      role: 'assistant',
      content: "Hi! I'm your personal scheduling assistant. How can I help organize your day today? You can tell me about events you'd like to add, or I can help you review your schedule."
    }
  ])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return
    
    const userMessage = message.trim()
    setMessage('')
    setIsLoading(true)
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    
    try {
      // Process the message and extract event information
      const response = await fetch('/api/process-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      })
      
      const data = await response.json()
      
      if (data.events) {
        // Add the events to the calendar
        const newEvents = data.events.map((event: APIEvent) => toCalendarEvent(event))
        setEvents(prev => [...prev, ...newEvents])
      }
      
      // Add assistant's response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error processing message:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error while processing your request. Could you please try again?" 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSlot = async (slotInfo: { start: Date; end: Date }) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `add event from ${format(slotInfo.start, 'h:mm a')} to ${format(slotInfo.end, 'h:mm a')} on ${format(slotInfo.start, 'EEEE, MMMM d')}`
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
        const newEvent = toCalendarEvent(data.event)
        setEvents(prev => [...prev, newEvent])
      }
    } catch (error) {
      console.error('Error creating event:', error)
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
    } catch (error) {
      console.error('Error deleting event:', error)
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
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start space-x-2",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%]",
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  )}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
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
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={!message.trim() || isLoading}>
                  {isLoading ? (
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
                  min={new Date(0, 0, 0, 0, 0, 0)}
                  max={new Date(0, 0, 0, 23, 59, 59)}
                  defaultDate={new Date()}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
