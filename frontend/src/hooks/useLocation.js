import { useState, useCallback } from 'react'

export const useLocation = () => {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      setLoading(true)
      setError(null)

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            
            // Reverse geocoding to get address
            const address = await reverseGeocode(latitude, longitude)
            
            const locationData = {
              latitude,
              longitude,
              name: address.name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              address: address.address || ''
            }
            
            setLocation(locationData)
            setLoading(false)
            resolve(locationData)
          } catch (error) {
            setError('Failed to get address information')
            setLoading(false)
            reject(error)
          }
        },
        (error) => {
          let errorMessage = 'Failed to get location'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }
          setError(errorMessage)
          setLoading(false)
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }, [])

  const reverseGeocode = async (latitude, longitude) => {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      )
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed')
      }
      
      const data = await response.json()
      
      if (data && data.display_name) {
        return {
          name: data.name || data.display_name.split(',')[0],
          address: data.display_name
        }
      }
      
      return {
        name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        address: ''
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return {
        name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        address: ''
      }
    }
  }

  const clearLocation = useCallback(() => {
    setLocation(null)
    setError(null)
  }, [])

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    clearLocation
  }
}
