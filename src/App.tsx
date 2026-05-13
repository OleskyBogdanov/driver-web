import { useState } from 'react'
import styles from './App.module.css'
import SchedulePage from './components/SchedulePage'
import DriversPage from './components/DriversPage'

type Tab = 'schedule' | 'drivers'

export default function App() {
  const [tab, setTab] = useState<Tab>('schedule')

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2"/>
            <path d="M16 8h4l3 3v4h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          Driver Service
        </div>
        <nav className={styles.nav}>
          <button
            className={`${styles.navBtn} ${tab === 'schedule' ? styles.active : ''}`}
            onClick={() => setTab('schedule')}
          >
            Schedule
          </button>
          <button
            className={`${styles.navBtn} ${tab === 'drivers' ? styles.active : ''}`}
            onClick={() => setTab('drivers')}
          >
            Drivers
          </button>
        </nav>
      </header>
      <main className={styles.main}>
        {tab === 'schedule' ? <SchedulePage /> : <DriversPage />}
      </main>
    </div>
  )
}
