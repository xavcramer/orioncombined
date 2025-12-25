import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Catalog from './catalog/Catalog.jsx'

import { RequireAdmin } from './auth.jsx'
import Login from './admin/Login.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import Dashboard from './admin/Dashboard.jsx'
import Countries from './admin/Countries.jsx'
import Tours from './admin/Tours.jsx'
import Hotels from './admin/Hotels.jsx'
import Offers from './admin/Offers.jsx'

import "./main.css"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Catalog />} />

        <Route path="/admin/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="countries" element={<Countries />} />
          <Route path="tours" element={<Tours />} />
          <Route path="hotels" element={<Hotels />} />
          <Route path="offers" element={<Offers />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
