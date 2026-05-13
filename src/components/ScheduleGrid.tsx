import type { Driver } from '../types/Driver'
import styles from './ScheduleGrid.module.css'

interface Props {
  drivers: Driver[]
  entries: Map<string, boolean>
  pinnedEntries: Set<string>
  monthlyHours: Record<string, number>
  dates: string[]
  today: string
  onToggle: (driverId: number, date: string) => void
  loading: boolean
}

function parseDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    dayMonth: d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
    isWeekend: d.getDay() === 0 || d.getDay() === 6,
  }
}

export default function ScheduleGrid({ drivers, entries, pinnedEntries, monthlyHours, dates, today, onToggle, loading }: Props) {
  if (drivers.length === 0) {
    return (
      <div className={styles.empty}>
        No drivers yet — add some on the Drivers tab.
      </div>
    )
  }

  return (
    <div className={`${styles.wrapper} ${loading ? styles.dimmed : ''}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={`${styles.th} ${styles.dateCol}`}>Date</th>
            {drivers.map(driver => {
              const regTimes = `${driver.workStart}–${driver.workEnd}`
              const friTimes = `${driver.fridayWorkStart}–${driver.fridayWorkEnd}`
              const hours = monthlyHours[String(driver.id)]
              return (
                <th key={driver.id} className={styles.th}>
                  <div className={styles.driverHeader}>
                    <span className={styles.driverName}>{driver.driverName}</span>
                    <span className={styles.driverSub}>{driver.car}</span>
                    <span className={styles.driverSub}>{driver.licensePlate}</span>
                    <span className={styles.driverTimes}>{regTimes}</span>
                    {friTimes !== regTimes && (
                      <span className={styles.driverTimes}>Fri: {friTimes}</span>
                    )}
                    {hours != null && (
                      <span className={styles.driverHours}>{hours.toFixed(1)} h</span>
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {dates.map(date => {
            const { weekday, dayMonth, isWeekend } = parseDate(date)
            const isToday = date === today
            return (
              <tr
                key={date}
                className={`${isToday ? styles.todayRow : ''} ${isWeekend ? styles.weekendRow : ''}`}
              >
                <td className={`${styles.dateCell} ${isToday ? styles.todayDate : ''}`}>
                  <span className={styles.weekday}>{weekday}</span>
                  <span className={styles.dayMonth}>{dayMonth}</span>
                </td>
                {drivers.map(driver => {
                  const key = `${driver.id}-${date}`
                  const working = entries.get(key) ?? false
                  const pinned = pinnedEntries.has(key)
                  return (
                    <td
                      key={driver.id}
                      className={`${styles.cell} ${working ? styles.working : styles.notWorking} ${pinned ? styles.pinned : ''}`}
                      onClick={() => !loading && onToggle(driver.id, date)}
                      title={working ? (pinned ? 'Working (pinned) — click to toggle' : 'Working — click to toggle') : 'Off — click to toggle'}
                    >
                      {working ? '✓' : '✗'}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
