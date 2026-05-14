import { useState } from 'react'
import type { Driver } from '../types/Driver'
import type { DayEvent, EventType } from '../types/Event'
import { EVENT_TYPE_LABELS } from '../types/Event'
import type { CreateEventPayload } from '../api/events'
import styles from './EventPanel.module.css'

interface Props {
  driver: Driver
  date: string
  isAdmin: boolean
  working: boolean
  events: DayEvent[]
  onClose: () => void
  onToggleWorking: () => void
  onAddEvent: (payload: CreateEventPayload) => Promise<void>
  onDeleteEvent: (id: number) => Promise<void>
}

const EVENT_TYPES: EventType[] = ['TECHNICAL_INSPECTION', 'WASHING', 'TASK']

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function EventPanel({
  driver, date, isAdmin, working, events, onClose, onToggleWorking, onAddEvent, onDeleteEvent,
}: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<EventType>('TASK')
  const [specifyPoints, setSpecifyPoints] = useState(false)
  const [departure, setDeparture] = useState('')
  const [arrival, setArrival] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setFormError('Name is required'); return }
    setSubmitting(true)
    setFormError(null)
    try {
      await onAddEvent({
        driverId: driver.id,
        date,
        name: name.trim(),
        type,
        departurePoint: specifyPoints && departure.trim() ? departure.trim() : undefined,
        arrivalPoint: specifyPoints && arrival.trim() ? arrival.trim() : undefined,
      })
      setName('')
      setDeparture('')
      setArrival('')
      setSpecifyPoints(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add event')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <div className={styles.driverName}>{driver.driverName}</div>
            <div className={styles.dateLabel}>{formatDate(date)}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {isAdmin && (
          <div className={styles.workingRow}>
            <span className={styles.workingLabel}>Working day</span>
            <button
              className={`${styles.toggleBtn} ${working ? styles.toggleOn : styles.toggleOff}`}
              onClick={onToggleWorking}
              role="switch"
              aria-checked={working}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        )}

        <div className={styles.eventsSection}>
          <div className={styles.sectionTitle}>Events</div>
          {events.length === 0 ? (
            <div className={styles.noEvents}>No events for this day</div>
          ) : (
            <ul className={styles.eventList}>
              {events.map(ev => (
                <li key={ev.id} className={styles.eventItem}>
                  <div className={styles.eventMain}>
                    <span className={styles.eventName}>{ev.name}</span>
                    <span className={`${styles.eventType} ${styles[`type_${ev.type}`]}`}>
                      {EVENT_TYPE_LABELS[ev.type]}
                    </span>
                    {(ev.departurePoint || ev.arrivalPoint) && (
                      <div className={styles.eventPoints}>
                        {ev.departurePoint && <span>From: {ev.departurePoint}</span>}
                        {ev.arrivalPoint && <span>To: {ev.arrivalPoint}</span>}
                      </div>
                    )}
                  </div>
                  <button
                    className={styles.deleteEventBtn}
                    onClick={() => void onDeleteEvent(ev.id)}
                    aria-label="Delete event"
                  >✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className={styles.addForm} onSubmit={e => void handleSubmit(e)}>
          <div className={styles.sectionTitle}>Add event</div>
          <input
            className={styles.input}
            placeholder="Event name"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={submitting}
          />
          <select
            className={styles.select}
            value={type}
            onChange={e => setType(e.target.value as EventType)}
            disabled={submitting}
          >
            {EVENT_TYPES.map(t => (
              <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
            ))}
          </select>

          <label className={styles.switchRow}>
            <input
              type="checkbox"
              className={styles.checkboxHidden}
              checked={specifyPoints}
              onChange={e => setSpecifyPoints(e.target.checked)}
              disabled={submitting}
            />
            <span className={`${styles.switchTrack} ${specifyPoints ? styles.switchOn : ''}`}>
              <span className={styles.switchThumb} />
            </span>
            <span className={styles.switchLabel}>Specify points</span>
          </label>

          {specifyPoints && (
            <div className={styles.pointsFields}>
              <input
                className={styles.input}
                placeholder="Departure point"
                value={departure}
                onChange={e => setDeparture(e.target.value)}
                disabled={submitting}
              />
              <input
                className={styles.input}
                placeholder="Arrival point"
                value={arrival}
                onChange={e => setArrival(e.target.value)}
                disabled={submitting}
              />
            </div>
          )}

          {formError && <div className={styles.formError}>{formError}</div>}

          <button className={styles.addBtn} type="submit" disabled={submitting || !name.trim()}>
            {submitting ? 'Adding…' : '+ Add event'}
          </button>
        </form>
      </div>
    </div>
  )
}
