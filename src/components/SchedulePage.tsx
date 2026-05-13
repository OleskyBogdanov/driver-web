import { useState, useEffect, useCallback } from 'react'
import { getSchedule, generateSchedule, setWorking } from '../api/schedule'
import { getDrivers } from '../api/drivers'
import type { Driver } from '../types/Driver'
import ScheduleGrid from './ScheduleGrid'
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

export default function SchedulePage({ isAdmin }: Props) {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [entries, setEntries] = useState<Map<string, boolean>>(new Map())
  const [pinnedEntries, setPinnedEntries] = useState<Set<string>>(new Set())
  const [monthlyHours, setMonthlyHours] = useState<Record<string, number>>({})
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
        monthlyHours={monthlyHours}
        dates={dates}
        today={todayStr}
        onToggle={handleToggle}
        loading={loading}
      />
    </div>
  )
}
