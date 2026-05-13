import { useState, useEffect } from 'react'
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../api/drivers'
import type { Driver } from '../types/Driver'
import DriverDialog from './DriverDialog'
import styles from './DriversPage.module.css'

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogDriver, setDialogDriver] = useState<Driver | null | undefined>(undefined)
  const [confirmDelete, setConfirmDelete] = useState<Driver | null>(null)

  useEffect(() => {
    void getDrivers()
      .then(setDrivers)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (data: Omit<Driver, 'id'>) => {
    if (dialogDriver) {
      const updated = await updateDriver({ ...data, id: dialogDriver.id })
      setDrivers(ds => ds.map(d => d.id === updated.id ? updated : d))
    } else {
      const created = await createDriver(data)
      setDrivers(ds => [...ds, created])
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteDriver(confirmDelete.id)
      setDrivers(ds => ds.filter(d => d.id !== confirmDelete.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setConfirmDelete(null)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h2 className={styles.heading}>Drivers</h2>
        <button className={styles.addBtn} onClick={() => setDialogDriver(null)}>
          + Add Driver
        </button>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} className={styles.dismiss}>✕</button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : drivers.length === 0 ? (
        <div className={styles.empty}>
          No drivers yet.{' '}
          <button className={styles.emptyLink} onClick={() => setDialogDriver(null)}>Add the first one.</button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Car</th>
                <th>Plate</th>
                <th>Mon–Thu</th>
                <th>Friday</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {drivers.map(driver => (
                <tr key={driver.id}>
                  <td className={styles.nameCell}>{driver.driverName}</td>
                  <td>{driver.car}</td>
                  <td><span className={styles.plate}>{driver.licensePlate}</span></td>
                  <td className={styles.times}>{driver.workStart}–{driver.workEnd}</td>
                  <td className={styles.times}>{driver.fridayWorkStart}–{driver.fridayWorkEnd}</td>
                  <td className={styles.actions}>
                    <button
                      className={styles.editBtn}
                      onClick={() => setDialogDriver(driver)}
                      aria-label="Edit"
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => setConfirmDelete(driver)}
                      aria-label="Delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialogDriver !== undefined && (
        <DriverDialog
          driver={dialogDriver}
          onSave={handleSave}
          onClose={() => setDialogDriver(undefined)}
        />
      )}

      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className={styles.confirmDialog}>
            <p className={styles.confirmText}>
              Delete <strong>{confirmDelete.driverName}</strong>? This also removes all their schedule entries.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
