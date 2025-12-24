import { useEffect, useState } from 'react'
import { api } from '../api.js'

function Stat({ title, value, hint }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e7e7e7', borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 12, color: '#666' }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{value}</div>
      {hint ? <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{hint}</div> : null}
    </div>
  )
}

export default function Dashboard() {
  const [countries, setCountries] = useState([])
  const [tours, setTours] = useState([])
  const [hotels, setHotels] = useState([])
  const [offers, setOffers] = useState([])

  useEffect(() => {
    Promise.all([
      api('/admin/countries').catch(() => []),
      api('/admin/tours').catch(() => []),
      api('/admin/hotels').catch(() => []),
      api('/admin/offers').catch(() => []),
    ]).then(([c, t, h, o]) => {
      setCountries(c || [])
      setTours(t || [])
      setHotels(h || [])
      setOffers(o || [])
    })
  }, [])

  const offersAvailable = offers.filter((x) => x.is_available).length

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <Stat title="Стран" value={countries.length} />
        <Stat title="Туров" value={tours.length} hint={`Hot: ${tours.filter((x) => x.is_hot).length}`} />
        <Stat title="Отелей" value={hotels.length} />
        <Stat title="Офферов" value={offers.length} hint={`Доступно: ${offersAvailable}`} />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e7e7e7', borderRadius: 14, padding: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Подсказка</div>
        <div style={{ color: '#666', fontSize: 14 }}>
          Самая “операторская” страница — <b>Офферы</b>. Там удобно держать цены, доступность и места.
        </div>
      </div>
    </div>
  )
}
