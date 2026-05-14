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

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1.5 15H6.5L5 6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

export default function EventPanel({
  driver, date, isAdmin, working, events, onClose, onToggleWorking, onAddEvent, onDeleteEvent,
}: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<EventType>('TASK')
  const [specifyPoints, setSpecifyPoints] = useState(false)
  const [departure, setDeparture] = useState('')
  const [arrival, setArrival] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [timeTo, setTimeTo] = useState('')
  const [assignedBy, setAssignedBy] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<DayEvent | null>(null)

  const isTask = type === 'TASK'

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
        timeFrom: isTask && timeFrom ? timeFrom : undefined,
        timeTo: isTask && timeTo ? timeTo : undefined,
        assignedBy: isTask && assignedBy.trim() ? assignedBy.trim() : undefined,
      })
      setName('')
      setDeparture('')
      setArrival('')
      setTimeFrom('')
      setTimeTo('')
      setAssignedBy('')
      setSpecifyPoints(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteEvent) return
    await onDeleteEvent(confirmDeleteEvent.id)
    setConfirmDeleteEvent(null)
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
                <li key={ev.id} className={`${styles.eventItem} ${styles[`accent_${ev.type}`]}`}>
                  <div className={styles.eventMain}>
                    <div className={styles.eventTopRow}>
                      <span className={`${styles.eventType} ${styles[`type_${ev.type}`]}`}>
                        {EVENT_TYPE_LABELS[ev.type]}
                      </span>
                      <span className={styles.eventName}>{ev.name}</span>
                    </div>
                    {ev.type === 'TASK' && (ev.timeFrom || ev.timeTo) && (
                      <div className={styles.eventMeta}>
                        {ev.timeFrom ?? '?'} – {ev.timeTo ?? '?'}
                      </div>
                    )}
                    {ev.type === 'TASK' && ev.assignedBy && (
                      <div className={styles.eventMeta}>Set by: {ev.assignedBy}</div>
                    )}
                    {(ev.departurePoint || ev.arrivalPoint) && (
                      <div className={styles.eventPoints}>
                        {ev.departurePoint ?? '?'} → {ev.arrivalPoint ?? '?'}
                      </div>
                    )}
                  </div>
                  <button
                    className={styles.deleteEventBtn}
                    onClick={() => setConfirmDeleteEvent(ev)}
                    aria-label="Delete event"
                  >
                    <TrashIcon />
                  </button>
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

          {isTask && (
            <div className={styles.taskFields}>
              <div className={styles.timeRow}>
                <div className={styles.timeField}>
                  <label className={styles.fieldLabel}>From</label>
                  <input
                    type="time"
                    className={styles.input}
                    value={timeFrom}
                    onChange={e => setTimeFrom(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className={styles.timeField}>
                  <label className={styles.fieldLabel}>To</label>
                  <input
                    type="time"
                    className={styles.input}
                    value={timeTo}
                    onChange={e => setTimeTo(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
              <input
                className={styles.input}
                placeholder="Assigned by"
                value={assignedBy}
                onChange={e => setAssignedBy(e.target.value)}
                disabled={submitting}
              />
            </div>
          )}

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

      {confirmDeleteEvent && (
        <div
          className={styles.confirmOverlay}
          onClick={e => e.target === e.currentTarget && setConfirmDeleteEvent(null)}
        >
          <div className={styles.confirmBox}>
            <h4 className={styles.confirmTitle}>Delete event</h4>
            <p className={styles.confirmText}>
              Delete <strong>{confirmDeleteEvent.name}</strong>? This cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDeleteEvent(null)}>
                Cancel
              </button>
              <button className={styles.confirmDeleteBtn} onClick={() => void handleConfirmDelete()}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
