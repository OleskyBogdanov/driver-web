import { useState, useEffect } from 'react'
import { getSchedule } from '../api/schedule'
import { getEvents } from '../api/events'
import { getDrivers } from '../api/drivers'
import type { Driver } from '../types/Driver'
import type { DayEvent } from '../types/Event'
import { EVENT_TYPE_LABELS } from '../types/Event'
import styles from './DayViewPage.module.css'

interface Props {
  isAdmin: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function DayViewPage({ isAdmin }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(todayStr)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [working, setWorking] = useState<Set<number>>(new Set())
  const [events, setEvents] = useState<Map<number, DayEvent[]>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const storedDriver = localStorage.getItem('driver')
        const sessionDriver: Driver | null = storedDriver ? JSON.parse(storedDriver) as Driver : null
        const [driversData, scheduleData] = await Promise.all([
          isAdmin ? getDrivers() : Promise.resolve(sessionDriver ? [sessionDriver] : []),
          getSchedule(date, date),
        ])
        setDrivers(driversData)
        const workingSet = new Set<number>()
        scheduleData.entries.forEach(e => { if (e.working) workingSet.add(e.driverId) })
        setWorking(workingSet)
        let eventsData: DayEvent[] = []
        try { eventsData = await getEvents(date, date) } catch { /* events optional */ }
        const eventsMap = new Map<number, DayEvent[]>()
        eventsData.forEach(ev => {
          const list = eventsMap.get(ev.driverId) ?? []
          list.push(ev)
          eventsMap.set(ev.driverId, list)
        })
        setEvents(eventsMap)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [date, isAdmin])

  const prevDay = () => {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() - 1)
    setDate(d.toISOString().slice(0, 10))
  }
  const nextDay = () => {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    setDate(d.toISOString().slice(0, 10))
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.dateNav}>
          <button className={styles.arrowBtn} onClick={prevDay} aria-label="Previous day">‹</button>
          <div className={styles.dateCenter}>
            <span className={styles.dateLabel}>{formatDate(date)}</span>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={styles.dateInput}
              aria-label="Select date"
            />
          </div>
          <button className={styles.arrowBtn} onClick={nextDay} aria-label="Next day">›</button>
        </div>
        {date !== todayStr && (
          <button className={styles.todayBtn} onClick={() => setDate(todayStr)}>Today</button>
        )}
      </div>

      <div className={styles.content}>
        {loading && <div className={styles.loading}>Loading…</div>}

        {!loading && drivers.length === 0 && (
          <div className={styles.empty}>No drivers to display.</div>
        )}

        {!loading && drivers.length > 0 && (
          <div className={styles.grid}>
            {drivers.map(driver => {
              const isWorking = working.has(driver.id)
              const driverEvents = events.get(driver.id) ?? []
              return (
                <div key={driver.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.driverInfo}>
                      <span className={styles.driverName}>{driver.driverName}</span>
                      <span className={styles.driverSub}>{driver.car} · {driver.licensePlate}</span>
                    </div>
                    <span className={`${styles.statusBadge} ${isWorking ? styles.workingBadge : styles.offBadge}`}>
                      {isWorking ? 'Working' : 'Off'}
                    </span>
                  </div>

                  {driverEvents.length === 0 ? (
                    <div className={styles.noEvents}>No events</div>
                  ) : (
                    <ul className={styles.eventList}>
                      {driverEvents.map(ev => (
                        <li key={ev.id} className={styles.eventItem}>
                          <span className={`${styles.typeBadge} ${styles[`type_${ev.type}`]}`}>
                            {EVENT_TYPE_LABELS[ev.type]}
                          </span>
                          <div className={styles.eventDetails}>
                            <span className={styles.eventName}>{ev.name}</span>
                            {(ev.departurePoint || ev.arrivalPoint) && (
                              <span className={styles.eventPoints}>
                                {ev.departurePoint && `From: ${ev.departurePoint}`}
                                {ev.departurePoint && ev.arrivalPoint && ' · '}
                                {ev.arrivalPoint && `To: ${ev.arrivalPoint}`}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
