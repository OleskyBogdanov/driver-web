import { useState, useEffect } from 'react'
import { getUsers, createUser, deleteUser } from '../api/auth'
import type { UserInfo } from '../types/User'
import styles from './UsersPage.module.css'

export default function UsersPage() {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<UserInfo | null>(null)

  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'DRIVER' | 'ADMIN'>('DRIVER')
  const [newDriverId, setNewDriverId] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    void getUsers()
      .then(setUsers)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!newUsername.trim() || !newPassword) {
      setFormError('Username and password are required')
      return
    }
    const driverId = newDriverId.trim() ? Number(newDriverId.trim()) : undefined
    if (newDriverId.trim() && (isNaN(driverId!) || !Number.isInteger(driverId))) {
      setFormError('Driver ID must be a whole number')
      return
    }
    setSaving(true)
    try {
      const created = await createUser({
        username: newUsername.trim(),
        password: newPassword,
        ...(newRole === 'DRIVER' && driverId !== undefined ? { driverId } : {}),
      })
      setUsers(prev => [...prev, created])
      setNewUsername('')
      setNewPassword('')
      setNewRole('DRIVER')
      setNewDriverId('')
      setShowAddForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteUser(confirmDelete.id)
      setUsers(prev => prev.filter(u => u.id !== confirmDelete.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setConfirmDelete(null)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h2 className={styles.heading}>Users</h2>
        <button className={styles.addBtn} onClick={() => { setShowAddForm(true); setFormError(null) }}>
          + Add User
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
      ) : users.length === 0 ? (
        <div className={styles.empty}>
          No users yet.{' '}
          <button className={styles.emptyLink} onClick={() => setShowAddForm(true)}>Add the first one.</button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Driver</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td className={styles.usernameCell}>{user.username}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${user.role === 'ADMIN' ? styles.adminBadge : styles.driverBadge}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className={styles.driverCell}>{user.driverName ?? '—'}</td>
                  <td className={styles.actions}>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => setConfirmDelete(user)}
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

      {showAddForm && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setShowAddForm(false)}>
          <div className={styles.dialog}>
            <h3 className={styles.dialogTitle}>Add User</h3>
            <form onSubmit={handleAdd} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Username</label>
                <input
                  className={styles.input}
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  autoFocus
                  disabled={saving}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <input
                  className={styles.input}
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Role</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      value="DRIVER"
                      checked={newRole === 'DRIVER'}
                      onChange={() => setNewRole('DRIVER')}
                    />
                    Driver
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      value="ADMIN"
                      checked={newRole === 'ADMIN'}
                      onChange={() => setNewRole('ADMIN')}
                    />
                    Admin
                  </label>
                </div>
              </div>
              {newRole === 'DRIVER' && (
                <div className={styles.field}>
                  <label className={styles.label}>Driver ID <span className={styles.optional}>(optional)</span></label>
                  <input
                    className={styles.input}
                    type="number"
                    value={newDriverId}
                    onChange={e => setNewDriverId(e.target.value)}
                    placeholder="e.g. 1"
                    disabled={saving}
                  />
                </div>
              )}

              {formError && <div className={styles.formError}>{formError}</div>}

              <div className={styles.dialogActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddForm(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className={styles.dialog}>
            <p className={styles.confirmText}>
              Delete user <strong>{confirmDelete.username}</strong>?
            </p>
            <div className={styles.dialogActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className={styles.deleteConfirmBtn} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
