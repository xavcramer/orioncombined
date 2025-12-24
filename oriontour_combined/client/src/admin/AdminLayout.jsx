import React from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { logout } from './auth.jsx'

const NavLink = ({ to, children }) => {
  const loc = useLocation()
  const active = loc.pathname === to || loc.pathname.startsWith(to + '/')
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid #e7e7e7',
        background: active ? '#111' : '#fff',
        color: active ? '#fff' : '#111',
        fontWeight: 700,
      }}
    >
      {children}
    </Link>
  )
}

export default function AdminLayout() {
  const nav = useNavigate()

  const exit = () => {
    logout()
    nav('/admin/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, padding: 16 }}>
        <aside style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <div style={{ fontWeight: 900, fontSize: 18, padding: '6px 4px' }}>Admin</div>

          <NavLink to="/admin/dashboard">Dashboard</NavLink>
          <NavLink to="/admin/countries">Countries</NavLink>
          <NavLink to="/admin/tours">Tours</NavLink>
          <NavLink to="/admin/hotels">Hotels</NavLink>
          <NavLink to="/admin/offers">Offers</NavLink>

          <button
            onClick={exit}
            style={{
              marginTop: 8,
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Выйти
          </button>

          <Link to="/" style={{ marginTop: 8, color: '#666', fontSize: 13 }}>← в каталог</Link>
        </aside>

        <main style={{ background: '#fff', border: '1px solid #e7e7e7', borderRadius: 16, padding: 16 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
