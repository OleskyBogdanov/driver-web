import { useState, useEffect } from 'react'
import type { Driver } from '../types/Driver'
import styles from './DriverDialog.module.css'

type DriverForm = Omit<Driver, 'id'>

const EMPTY: DriverForm = {
  driverName: '',
  car: '',
  licensePlate: '',
  workStart: '08:20',
  workEnd: '17:35',
  fridayWorkStart: '08:20',
  fridayWorkEnd: '16:20',
}

interface Props {
  driver: Driver | null
  onSave: (data: DriverForm) => Promise<void>
  onClose: () => void
}

export default function DriverDialog({ driver, onSave, onClose }: Props) {
  const [form, setForm] = useState<DriverForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(driver ? { ...driver } : { ...EMPTY })
    setError(null)
  }, [driver])

  const set = (field: keyof DriverForm, value: string) =>
    setForm(f => ({ ...f, [field]: field === 'licensePlate' ? value.toUpperCase() : value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <div className={styles.dialogHeader}>
          <h2 className={styles.title}>{driver ? 'Edit Driver' : 'Add Driver'}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <label className={styles.label}>
              Full name
              <input
                className={styles.input}
                value={form.driverName}
                onChange={e => set('driverName', e.target.value)}
                required
                autoFocus
              />
            </label>
            <label className={styles.label}>
              Car model
              <input
                className={styles.input}
                value={form.car}
                onChange={e => set('car', e.target.value)}
                required
              />
            </label>
          </div>

          <label className={styles.label}>
            License plate
            <input
              className={styles.input}
              value={form.licensePlate}
              onChange={e => set('licensePlate', e.target.value)}
              required
              placeholder="ABC123"
            />
          </label>

          <div className={styles.sectionTitle}>Mon – Thu</div>
          <div className={styles.row}>
            <label className={styles.label}>
              Start
              <input type="time" className={styles.input} value={form.workStart} onChange={e => set('workStart', e.target.value)} required />
            </label>
            <label className={styles.label}>
              End
              <input type="time" className={styles.input} value={form.workEnd} onChange={e => set('workEnd', e.target.value)} required />
            </label>
          </div>

          <div className={styles.sectionTitle}>Friday</div>
          <div className={styles.row}>
            <label className={styles.label}>
              Start
              <input type="time" className={styles.input} value={form.fridayWorkStart} onChange={e => set('fridayWorkStart', e.target.value)} required />
            </label>
            <label className={styles.label}>
              End
              <input type="time" className={styles.input} value={form.fridayWorkEnd} onChange={e => set('fridayWorkEnd', e.target.value)} required />
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
