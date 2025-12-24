import React from 'react'
import { Navigate } from 'react-router-dom'

export function isAuthed() {
  const token = localStorage.getItem('adminToken')
  const isAdmin = localStorage.getItem('isAdmin') === 'true'
  return Boolean(token) || isAdmin
}

export function logout() {
  localStorage.removeItem('adminToken')
  localStorage.removeItem('isAdmin')
}

export function RequireAdmin({ children }) {
  if (!isAuthed()) return <Navigate to="/admin/login" replace />
  return children
}
