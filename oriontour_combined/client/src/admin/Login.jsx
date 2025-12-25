import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

export default function Login() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await api('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ login, password }),
      })

      // поддержка 2х вариантов: token или success:true
      if (data?.token) localStorage.setItem('adminToken', data.token)
      if (data?.success === true || data?.token) localStorage.setItem('isAdmin', 'true')

      navigate('/admin/dashboard')
    } catch (e) {
      alert(e.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <form onSubmit={submit} style={{ width: 380, background: '#fff', border: '1px solid #e7e7e7', borderRadius: 14, padding: 58 }}>
        <h2 style={{ marginTop: 0, fontFamily: 'Segoe UI'}}>Admin Login</h2>

        <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6, fontFamily: 'Segoe UI' }}>Login</label>
        <input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="admin"
          style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #ddd', marginBottom: 12, fontFamily: 'Segoe UI' }}
        />

        <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6, fontFamily: 'Segoe UI' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="admin"
          style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #ddd', marginBottom: 14, fontFamily: 'Segoe UI' }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '106%',
            padding: 10,
            borderRadius: 10,
            border: '1px solid #111',
            background: '#111',
            color: '#fff',
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
