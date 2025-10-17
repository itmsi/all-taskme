import { useState, useEffect, useRef } from 'react'

// Simple in-memory cache
const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useApiCache(key, apiCall, dependencies = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const cacheKey = Array.isArray(key) ? key.join('-') : key

  useEffect(() => {
    const fetchData = async () => {
      // Check cache first
      const cached = cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await apiCall()
        
        // Cache the result
        cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        })
        
        setData(result)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, dependencies)

  const invalidateCache = () => {
    cache.delete(cacheKey)
  }

  const refresh = async () => {
    cache.delete(cacheKey)
    setLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })
      
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, invalidateCache, refresh }
}

// Clear all cache
export const clearApiCache = () => {
  cache.clear()
}
