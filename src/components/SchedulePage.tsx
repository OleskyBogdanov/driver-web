import { useState, useEffect, useCallback } from 'react'
import { getSchedule, generateSchedule, setWorking } from '../api/schedule'
import { getDrivers } from '../api/drivers'
import { getEvents, createEvent, deleteEvent } from '../api/events'
import type { Driver } from '../types/Driver'
import type { DayEvent } from '../types/Event'
import type { CreateEventPayload } from '../api/events'
import ScheduleGrid from './ScheduleGrid'
import EventPanel from './EventPanel'
import styles from './SchedulePage.module.css'

interface Props {
  isAdmin: boolean
}

function monthDates(year: number, month: number): string[] {
  const dates: string[] = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    dates.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

function buildEventsMap(evList: DayEvent[]): Map<string, DayEvent[]> {
  const map = new Map<string, DayEvent[]>()
  evList.forEach(ev => {
    const key = `${ev.driverId}-${ev.date}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(ev)
  })
  return map
}

export default function SchedulePage({ isAdmin }: Props) {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [entries, setEntries] = useState<Map<string, boolean>>(new Map())
  const [pinnedEntries, setPinnedEntries] = useState<Set<string>>(new Set())
  const [monthlyHours, setMonthlyHours] = useState<Record<string, number>>({})
  const [events, setEvents] = useState<Map<string, DayEvent[]>>(new Map())
  const [selectedCell, setSelectedCell] = useState<{ driverId: number; date: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const dates = monthDates(year, month)
  const from = dates[0]
  const to = dates[dates.length - 1]

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const storedDriver = localStorage.getItem('driver')
      const sessionDriver: Driver | null = storedDriver ? JSON.parse(storedDriver) as Driver : null
      const [driversData, scheduleData] = await Promise.all([
        isAdmin ? getDrivers() : Promise.resolve(sessionDriver ? [sessionDriver] : []),
        getSchedule(from, to),
      ])
      setDrivers(driversData)
      const map = new Map<string, boolean>()
      const pinned = new Set<string>()
      scheduleData.entries.forEach(e => {
        map.set(`${e.driverId}-${e.date}`, e.working)
        if (e.pinned) pinned.add(`${e.driverId}-${e.date}`)
      })
      setEntries(map)
      setPinnedEntries(pinned)
      setMonthlyHours(scheduleData.monthlyHoursPerDriver)
      // Events are supplementary — don't fail the whole page if this endpoint errors
      try {
        setEvents(buildEventsMap(await getEvents(from, to)))
      } catch {
        setEvents(new Map())
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { void loadAll() }, [loadAll])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await generateSchedule(from, to)
      const map = new Map(entries)
      const pinned = new Set(pinnedEntries)
      response.entries.forEach(e => {
        map.set(`${e.driverId}-${e.date}`, e.working)
        const key = `${e.driverId}-${e.date}`
        if (e.pinned) pinned.add(key)
        else pinned.delete(key)
      })
      setEntries(map)
      setPinnedEntries(pinned)
      setMonthlyHours(response.monthlyHoursPerDriver)
      showToast('Schedule generated')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (driverId: number, date: string) => {
    const key = `${driverId}-${date}`
    const newWorking = !(entries.get(key) ?? false)
    setEntries(prev => new Map(prev).set(key, newWorking))
    try {
      const result = await setWorking(driverId, date, newWorking)
      setEntries(prev => new Map(prev).set(key, result.working))
      setPinnedEntries(prev => {
        const next = new Set(prev)
        if (result.pinned) next.add(key)
        else next.delete(key)
        return next
      })
    } catch (e) {
      setEntries(prev => new Map(prev).set(key, !newWorking))
      setError(e instanceof Error ? e.message : 'Failed to update')
    }
  }

  const handleCellClick = (driverId: number, date: string) => {
    setSelectedCell({ driverId, date })
  }

  const handleAddEvent = async (payload: CreateEventPayload) => {
    const ev = await createEvent(payload)
    const key = `${ev.driverId}-${ev.date}`
    setEvents(prev => {
      const next = new Map(prev)
      const list = next.get(key) ?? []
      next.set(key, [...list, ev])
      return next
    })
  }

  const handleDeleteEvent = async (eventId: number, driverId: number, date: string) => {
    await deleteEvent(eventId)
    const key = `${driverId}-${date}`
    setEvents(prev => {
      const next = new Map(prev)
      next.set(key, (next.get(key) ?? []).filter(e => e.id !== eventId))
      return next
    })
  }

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const monthLabel = new Date(year, month, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const selectedDriver = selectedCell
    ? (drivers.find(d => d.id === selectedCell.driverId) ?? null)
    : null

  const eventCounts = new Map<string, number>()
  events.forEach((list, key) => { if (list.length > 0) eventCounts.set(key, list.length) })

  const taskHoursPerDriver: Record<number, number> = {}
  events.forEach(list => {
    list.filter(ev => ev.type === 'TASK' && ev.timeFrom && ev.timeTo).forEach(ev => {
      const [fh, fm] = ev.timeFrom!.split(':').map(Number)
      const [th, tm] = ev.timeTo!.split(':').map(Number)
      const h = (th + tm / 60) - (fh + fm / 60)
      if (h > 0) taskHoursPerDriver[ev.driverId] = (taskHoursPerDriver[ev.driverId] ?? 0) + h
    })
  })

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.monthNav}>
          <button className={styles.arrowBtn} onClick={prevMonth} aria-label="Previous month">‹</button>
          <span className={styles.monthLabel}>{monthLabel}</span>
          <button className={styles.arrowBtn} onClick={nextMonth} aria-label="Next month">›</button>
        </div>
        {isAdmin && (
          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={loading || drivers.length === 0}
          >
            {loading ? 'Working…' : '⚡ Generate'}
          </button>
        )}
      </div>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} className={styles.dismiss}>✕</button>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}

      <ScheduleGrid
        drivers={drivers}
        entries={entries}
        pinnedEntries={pinnedEntries}
        eventCounts={eventCounts}
        monthlyHours={monthlyHours}
        taskHours={taskHoursPerDriver}
        dates={dates}
        today={todayStr}
        onCellClick={handleCellClick}
        loading={loading}
      />

      {selectedCell && selectedDriver && (
        <EventPanel
          driver={selectedDriver}
          date={selectedCell.date}
          isAdmin={isAdmin}
          working={entries.get(`${selectedCell.driverId}-${selectedCell.date}`) ?? false}
          events={events.get(`${selectedCell.driverId}-${selectedCell.date}`) ?? []}
          onClose={() => setSelectedCell(null)}
          onToggleWorking={() => void handleToggle(selectedCell.driverId, selectedCell.date)}
          onAddEvent={handleAddEvent}
          onDeleteEvent={id => handleDeleteEvent(id, selectedCell.driverId, selectedCell.date)}
        />
      )}
    </div>
  )
}
