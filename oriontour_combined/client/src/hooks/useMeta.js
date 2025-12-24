import { useEffect, useState } from 'react'
import { api } from '../api.js'

export function useMeta() {
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api('/admin/meta')
      .then((d) => { if (!cancelled) setMeta(d) })
      .catch((e) => { if (!cancelled) setError(e) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  return { meta, loading, error }
}
