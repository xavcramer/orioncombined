import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { useMeta } from '../hooks/useMeta.js'
import DataTable from '../components/DataTable.jsx'
import Modal from '../components/Modal.jsx'

const empty = {
  id: null,
  country_id: '',
  resort_id: '',
  name: '',
  stars: '',
  address: '',
  lat: '',
  lng: '',
  description: '',
}

export default function Hotels() {
  const { meta } = useMeta()
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const load = async () => setRows(await api('/admin/hotels'))
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(r =>
      String(r.name || '').toLowerCase().includes(s) ||
      String(r.country_name || '').toLowerCase().includes(s) ||
      String(r.resort_name || '').toLowerCase().includes(s)
    )
  }, [rows, q])

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Отель' },
    { key: 'stars', title: '★' },
    { key: 'country_name', title: 'Страна' },
    { key: 'resort_name', title: 'Курорт' },
    { key: 'price_from', title: 'Цена от' },
    { key: 'rating_avg', title: 'Рейтинг' },
    { key: 'offers_count', title: 'Офферов' },
  ]

  const edit = (r) => {
    setForm({
      id: r.id,
      country_id: r.country_id ?? '',
      resort_id: r.resort_id ?? '',
      name: r.name || '',
      stars: r.stars ?? '',
      address: r.address || '',
      lat: r.lat ?? '',
      lng: r.lng ?? '',
      description: r.description || '',
    })
    setOpen(true)
  }

  const create = () => { setForm(empty); setOpen(true) }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        country_id: Number(form.country_id),
        resort_id: form.resort_id ? Number(form.resort_id) : null,
        stars: form.stars ? Number(form.stars) : null,
        lat: form.lat === '' ? null : Number(form.lat),
        lng: form.lng === '' ? null : Number(form.lng),
      }

      if (form.id) {
        await api(`/admin/hotels/${form.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await api('/admin/hotels', { method: 'POST', body: JSON.stringify(payload) })
      }

      setOpen(false)
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!form.id) return
    if (!confirm('Удалить отель?')) return
    try {
      await api(`/admin/hotels/${form.id}`, { method: 'DELETE' })
      setOpen(false)
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  const resortsForCountry = (meta?.resorts || []).filter(r => String(r.country_id) === String(form.country_id))

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по отелю/стране/курорту..." style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid #ddd' }} />
        <button onClick={create} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #111', background: '#111', color: '#fff' }}>
          + Добавить
        </button>
      </div>

      <DataTable columns={columns} rows={filtered} rowKey="id" onRowClick={edit} />

      <Modal
        title={form.id ? `Редактировать отель #${form.id}` : 'Новый отель'}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            {form.id ? (
              <button onClick={remove} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', background: '#fff' }}>
                Удалить
              </button>
            ) : null}

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
          <Field label="country_id">
            <select value={form.country_id} onChange={(e) => setForm({ ...form, country_id: e.target.value, resort_id: '' })}>
              <option value="">— выбрать —</option>
              {(meta?.countries || []).map(c => (
                <option key={c.id} value={c.id}>{c.name_ru} ({c.iso_code})</option>
              ))}
            </select>
          </Field>

          <Field label="resort_id">
            <select value={form.resort_id} onChange={(e) => setForm({ ...form, resort_id: e.target.value })} disabled={!form.country_id}>
              <option value="">— не выбран —</option>
              {resortsForCountry.map(r => (
                <option key={r.id} value={r.id}>{r.name_ru}</option>
              ))}
            </select>
          </Field>

          <Field label="name">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>

          <Field label="stars (1..5)">
            <input type="number" min="1" max="5" value={form.stars} onChange={(e) => setForm({ ...form, stars: e.target.value })} />
          </Field>

          <Field label="address">
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>

          <Field label="lat">
            <input type="number" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
          </Field>

          <Field label="lng">
            <input type="number" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
          </Field>

          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="description">
              <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
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
