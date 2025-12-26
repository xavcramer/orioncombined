import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { useMeta } from '../hooks/useMeta.js'
import DataTable from '../components/DataTable.jsx'
import Modal from '../components/Modal.jsx'

const empty = {
  tour_id: '',
  hotel_id: '',
  departure_city_id: '',
  start_date: '',
  nights: 7,
  meal_plan_id: '',
  price: '',
  currency_code: 'EUR',
  includes_flight: true,
  is_available: true,
  available_seats: '',
}

function formatAdminDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)

  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}


export default function Offers() {
  const { meta } = useMeta()
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const load = async () => setRows(await api('/admin/offers'))
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    let arr = rows
    if (onlyAvailable) arr = arr.filter(x => x.is_available)
    if (!s) return arr
    return arr.filter(r =>
      String(r.hotel_name || '').toLowerCase().includes(s) ||
      String(r.tour_title || '').toLowerCase().includes(s) ||
      String(r.departure_city_name || '').toLowerCase().includes(s)
    )
  }, [rows, q, onlyAvailable])

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'start_date', title: 'Дата', render: (r) => formatAdminDate(r.start_date) },
    { key: 'nights', title: 'Ночей' },
    { key: 'hotel_name', title: 'Отель' },
    { key: 'departure_city_name', title: 'Вылет' },
    { key: 'meal_plan_code', title: 'Пит.' },
    { key: 'price', title: 'Цена' },
    { key: 'currency_code', title: 'Вал.' },
    { key: 'is_available', title: 'Доступен', render: (r) => (r.is_available ? '✓' : '') },
  ]


  const create = () => { setForm(empty); setOpen(true) }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        tour_id: form.tour_id ? Number(form.tour_id) : null,
        hotel_id: Number(form.hotel_id),
        departure_city_id: Number(form.departure_city_id),
        start_date: form.start_date,
        nights: Number(form.nights),
        meal_plan_id: form.meal_plan_id ? Number(form.meal_plan_id) : null,
        price: Number(form.price),
        currency_code: form.currency_code,
        includes_flight: Boolean(form.includes_flight),
        is_available: Boolean(form.is_available),
        available_seats: form.available_seats === '' ? null : Number(form.available_seats),
      }

      await api('/admin/offers', { method: 'POST', body: JSON.stringify(payload) })
      setOpen(false)
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row) => {
    if (!confirm(`Удалить оффер #${row.id}?`)) return
    try {
      await api(`/admin/offers/${row.id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск: отель / тур / город вылета..." style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid #ddd' }} />

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#333' }}>
          <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
          только доступные
        </label>


        <button onClick={create} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #111', background: '#111', color: '#fff' }}>
          + Создать оффер
        </button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <DataTable
          columns={[
            ...columns,
            {
              key: '__actions',
              title: '',
              render: (r) => (
                <button
                  onClick={(e) => { e.stopPropagation(); remove(r) }}
                  style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                >
                  Удалить
                </button>
              )
            }
          ]}
          rows={filtered}
          rowKey="id"
        />
      </div>

      <Modal
        title="Новый оффер"
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button onClick={() => setOpen(false)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', background: '#fff' }}>
              Отмена
            </button>
            <button disabled={saving} onClick={save} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #111', background: '#111', color: '#fff', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <Field label="tour_id (опц.)">
            <input value={form.tour_id} onChange={(e) => setForm({ ...form, tour_id: e.target.value })} placeholder="id тура или пусто" />
          </Field>

          <Field label="hotel_id">
            <input value={form.hotel_id} onChange={(e) => setForm({ ...form, hotel_id: e.target.value })} placeholder="id отеля" />
          </Field>

          <Field label="departure_city_id">
            <select value={form.departure_city_id} onChange={(e) => setForm({ ...form, departure_city_id: e.target.value })}>
              <option value="">— выбрать —</option>
              {(meta?.departureCities || []).map(d => (
                <option key={d.id} value={d.id}>{d.name_ru}</option>
              ))}
            </select>
          </Field>

          <Field label="start_date">
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </Field>

          <Field label="nights">
            <input type="number" min="1" max="60" value={form.nights} onChange={(e) => setForm({ ...form, nights: e.target.value })} />
          </Field>

          <Field label="meal_plan_id (опц.)">
            <select value={form.meal_plan_id} onChange={(e) => setForm({ ...form, meal_plan_id: e.target.value })}>
              <option value="">— не выбран —</option>
              {(meta?.mealPlans || []).map(m => (
                <option key={m.id} value={m.id}>{m.code} — {m.name_ru}</option>
              ))}
            </select>
          </Field>

          <Field label="price">
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>

          <Field label="currency_code">
            <select value={form.currency_code} onChange={(e) => setForm({ ...form, currency_code: e.target.value })}>
              {(meta?.currencies || []).map(c => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.includes_flight} onChange={(e) => setForm({ ...form, includes_flight: e.target.checked })} />
              includes_flight
            </label>


            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
              is_available
            </label>
          </div>

          <Field label="available_seats (опц.)">
            <input type="number" value={form.available_seats} onChange={(e) => setForm({ ...form, available_seats: e.target.value })} />
          </Field>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
          Подсказка: для выбора отеля/тура по имени можно добавить endpoint поиска или подтягивать список отелей — сейчас форма по ID (самый быстрый старт).
        </div>
      </Modal>
    </div>
  )
}

function Field({ label, children }) {
  const el = React.cloneElement(children, {
    style: { padding: 10, borderRadius: 10, border: '1px solid #ddd', width: '100%' }
  })
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
      {el}
    </div>
  )
}