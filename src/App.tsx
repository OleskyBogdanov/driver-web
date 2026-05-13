import { useState, useEffect } from 'react'
import styles from './App.module.css'
import LoginPage from './components/LoginPage'
import SchedulePage from './components/SchedulePage'
import DriversPage from './components/DriversPage'
import UsersPage from './components/UsersPage'
import type { LoginResponse } from './types/User'

type Tab = 'schedule' | 'drivers' | 'users'

function saveSession(response: LoginResponse) {
  localStorage.setItem('token', response.token)
  localStorage.setItem('role', response.role)
  localStorage.setItem('username', response.username)
  if (response.driverId != null) localStorage.setItem('driverId', String(response.driverId))
  if (response.driver != null) localStorage.setItem('driver', JSON.stringify(response.driver))
}

function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('username')
  localStorage.removeItem('driverId')
  localStorage.removeItem('driver')
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [role, setRole] = useState<string | null>(() => localStorage.getItem('role'))
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'))
  const [tab, setTab] = useState<Tab>('schedule')

  const isAdmin = role === 'ADMIN'

  useEffect(() => {
    const handler = () => {
      setToken(null)
      setRole(null)
      setUsername(null)
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const handleLogin = (response: LoginResponse) => {
    saveSession(response)
    setToken(response.token)
    setRole(response.role)
    setUsername(response.username)
    setTab('schedule')
  }

  const handleLogout = () => {
    clearSession()
    setToken(null)
    setRole(null)
    setUsername(null)
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} />
  }

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
          {isAdmin && (
            <button
              className={`${styles.navBtn} ${tab === 'drivers' ? styles.active : ''}`}
              onClick={() => setTab('drivers')}
            >
              Drivers
            </button>
          )}
          {isAdmin && (
            <button
              className={`${styles.navBtn} ${tab === 'users' ? styles.active : ''}`}
              onClick={() => setTab('users')}
            >
              Users
            </button>
          )}
        </nav>
        <div className={styles.userArea}>
          <span className={styles.userLabel}>{username}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Log out</button>
        </div>
      </header>
      <main className={styles.main}>
        {tab === 'schedule' && <SchedulePage isAdmin={isAdmin} />}
        {tab === 'drivers' && isAdmin && <DriversPage />}
        {tab === 'users' && isAdmin && <UsersPage />}
      </main>
    </div>
  )
}
