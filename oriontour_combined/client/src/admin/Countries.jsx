import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import DataTable from '../components/DataTable.jsx'
import Modal from '../components/Modal.jsx'

const empty = {
  id: null,
  name_ru: '',
  name_en: '',
  iso_code: '',
  lat: 0,
  lng: 0,
  flag_url: '',
  is_popular: false,
  popularity_score: 0,
}

export default function Countries() {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const load = async () => setRows(await api('/admin/countries'))
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(r =>
      String(r.name_ru || '').toLowerCase().includes(s) ||
      String(r.iso_code || '').toLowerCase().includes(s) ||
      String(r.name_en || '').toLowerCase().includes(s)
    )
  }, [rows, q])

  const columns = [
    { key: 'name_ru', title: 'Страна' },
    { key: 'iso_code', title: 'ISO' },
    { key: 'is_popular', title: 'Popular', render: (r) => (r.is_popular ? '✓' : '') },
    { key: 'popularity_score', title: 'Score' },
    { key: 'hotels_count', title: 'Отелей' },
    { key: 'offers_count', title: 'Офферов' },
  ]

  const edit = (r) => {
    // globe_markers включает поля страны, но на всякий:
    setForm({
      ...empty,
      ...r,
      lat: Number(r.lat ?? 0),
      lng: Number(r.lng ?? 0),
      popularity_score: Number(r.popularity_score ?? 0),
      is_popular: Boolean(r.is_popular),
    })
    setOpen(true)
  }

  const create = () => { setForm(empty); setOpen(true) }

  const save = async () => {
    setSaving(true)
    try {
      if (form.id) {
        await api(`/admin/countries/${form.id}`, { method: 'PUT', body: JSON.stringify(form) })
      } else {
        await api('/admin/countries', { method: 'POST', body: JSON.stringify(form) })
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
    if (!confirm('Удалить страну?')) return
    try {
      await api(`/admin/countries/${form.id}`, { method: 'DELETE' })
      setOpen(false)
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск: Россия / RU / Russia ..."
          style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid #ddd' }}
        />
        <button onClick={create} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #111', background: '#111', color: '#fff' }}>
          + Добавить
        </button>
      </div>

      <DataTable columns={columns} rows={filtered} rowKey="id" onRowClick={edit} />

      <Modal
        title={form.id ? `Редактировать страну #${form.id}` : 'Новая страна'}
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
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
          <Field label="name_ru">
            <input value={form.name_ru} onChange={(e) => setForm({ ...form, name_ru: e.target.value })} />
          </Field>
          <Field label="iso_code">
            <input value={form.iso_code} onChange={(e) => setForm({ ...form, iso_code: e.target.value.toUpperCase() })} maxLength={2} />
          </Field>

          <Field label="name_en">
            <input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          </Field>
          <Field label="flag_url">
            <input value={form.flag_url} onChange={(e) => setForm({ ...form, flag_url: e.target.value })} />
          </Field>

          <Field label="lat">
            <input type="number" value={form.lat} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} />
          </Field>
          <Field label="lng">
            <input type="number" value={form.lng} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} />
          </Field>

          <Field label="popularity_score">
            <input type="number" value={form.popularity_score} onChange={(e) => setForm({ ...form, popularity_score: Number(e.target.value) })} />
          </Field>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 22 }}>
            <input
              id="popular"
              type="checkbox"
              checked={form.is_popular}
              onChange={(e) => setForm({ ...form, is_popular: e.target.checked })}
            />
            <label htmlFor="popular">is_popular</label>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
      {React.cloneElement(children, {
        style: { padding: 10, borderRadius: 10, border: '1px solid #ddd' }
      })}
    </div>
  )
}
