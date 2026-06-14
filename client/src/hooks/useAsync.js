import { useCallback, useEffect, useState } from 'react'
import { extractMessage } from '../services/api'

export default function useAsync(loader, dependencies = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const run = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await loader()
      setData(result)
      return result
    } catch (err) {
      setError(extractMessage(err))
      return null
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    run()
  }, [run])

  return { data, loading, error, reload: run, setData, setError }
}
