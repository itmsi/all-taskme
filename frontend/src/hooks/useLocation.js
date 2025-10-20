import { useState, useCallback } from 'react'

export const useLocation = () => {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getCurrentLocation = useCallback((retryWithHighAccuracy = false) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      setLoading(true)
      setError(null)

      const options = {
        enableHighAccuracy: retryWithHighAccuracy,
        timeout: retryWithHighAccuracy ? 20000 : 15000,
        maximumAge: retryWithHighAccuracy ? 60000 : 300000
      }

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
          let shouldRetry = false
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permission in your browser settings.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. This might be due to GPS being disabled or poor signal. You can try manual input instead.'
              shouldRetry = true
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again or use manual input.'
              shouldRetry = true
              break
            default:
              errorMessage = 'Unable to get your location. Please check your device settings or use manual input.'
              shouldRetry = true
          }
          
          setError(errorMessage)
          setLoading(false)
          
          // If it's a retryable error and we haven't tried high accuracy yet, don't reject immediately
          if (shouldRetry && !retryWithHighAccuracy) {
            // This will be handled by getCurrentLocationWithRetry
            reject(new Error(errorMessage))
          } else {
            reject(new Error(errorMessage))
          }
        },
        options
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

  const getCurrentLocationWithRetry = useCallback(async () => {
    try {
      // Try with low accuracy first (faster)
      return await getCurrentLocation(false)
    } catch (error) {
      // If failed, try with high accuracy
      try {
        console.log('Retrying with high accuracy...')
        return await getCurrentLocation(true)
      } catch (retryError) {
        console.log('Both attempts failed, throwing error')
        throw retryError
      }
    }
  }, [getCurrentLocation])

  const checkLocationSupport = useCallback(() => {
    if (!navigator.geolocation) {
      return {
        supported: false,
        message: 'Geolocation is not supported by this browser'
      }
    }
    
    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      return {
        supported: false,
        message: 'Location access requires HTTPS or localhost'
      }
    }
    
    return {
      supported: true,
      message: 'Location access is available'
    }
  }, [])

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    getCurrentLocationWithRetry,
    checkLocationSupport,
    clearLocation
  }
}
