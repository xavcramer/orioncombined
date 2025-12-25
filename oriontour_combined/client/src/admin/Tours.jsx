import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { useMeta } from '../hooks/useMeta.js'
import DataTable from '../components/DataTable.jsx'
import Modal from '../components/Modal.jsx'


const empty = { id: null, title: '', short_desc: '', country_id: '', image_url: '', is_hot: false }

export default function Tours() {
  const { meta } = useMeta()
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const load = async () => setRows(await api('/admin/tours'))
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(r =>
      String(r.title || '').toLowerCase().includes(s) ||
      String(r.country_name || '').toLowerCase().includes(s)
    )
  }, [rows, q])

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'title', title: 'Тур' },
    { key: 'country_name', title: 'Страна' },
    { key: 'is_hot', title: 'Hot', render: (r) => (r.is_hot ? '🔥' : '') },
    { key: 'price_from', title: 'Цена от' },
    { key: 'rating_avg', title: 'Рейтинг' },
    { key: 'offers_count', title: 'Офферов' },
  ]

  const edit = (r) => {
    setForm({
      id: r.id,
      title: r.title || '',
      short_desc: r.short_desc || '',
      country_id: r.country_id ?? '',
      image_url: r.image_url || '',
      is_hot: Boolean(r.is_hot),
    })
    setOpen(true)
  }

  const create = () => { setForm(empty); setOpen(true) }

  const save = async () => {
    setSaving(true)
    try {
      if (form.id) {
        await api(`/admin/tours/${form.id}`, { method: 'PUT', body: JSON.stringify(form) })
      } else {
        await api('/admin/tours', { method: 'POST', body: JSON.stringify(form) })
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
    if (!confirm('Удалить тур?')) return
    try {
      await api(`/admin/tours/${form.id}`, { method: 'DELETE' })
      setOpen(false)
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по туру/стране..." style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid #ddd' }} />
        <button onClick={create} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #111', background: '#111', color: '#fff' }}>
          + Добавить
        </button>
      </div>

      <DataTable columns={columns} rows={filtered} rowKey="id" onRowClick={edit} />

      <Modal
        title={form.id ? `Редактировать тур #${form.id}` : 'Новый тур'}
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
        <div style={{ display: 'grid', gap: 10 }}>
          <Field label="title">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>

          <Field label="country_id">
            <select value={form.country_id} onChange={(e) => setForm({ ...form, country_id: Number(e.target.value) })}>
              <option value="">— выбрать —</option>
              {(meta?.countries || []).map(c => (
                <option key={c.id} value={c.id}>{c.name_ru} ({c.iso_code})</option>
              ))}
            </select>
          </Field>

          <Field label="short_desc">
            <textarea rows={3} value={form.short_desc} onChange={(e) => setForm({ ...form, short_desc: e.target.value })} />
          </Field>

          <Field label="image_url">
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </Field>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input id="hot" type="checkbox" checked={form.is_hot} onChange={(e) => setForm({ ...form, is_hot: e.target.checked })} />
            <label htmlFor="hot">is_hot</label>
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
