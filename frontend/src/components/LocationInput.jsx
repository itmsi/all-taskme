import { useState } from 'react'
import { MapPin, Navigation, X } from 'lucide-react'
import { useLocation } from '../hooks/useLocation'
import Input from './Input'
import Button from './Button'

export default function LocationInput({ 
  value, 
  onChange, 
  className = '' 
}) {
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualLocation, setManualLocation] = useState({
    name: value?.name || '',
    latitude: value?.latitude || '',
    longitude: value?.longitude || '',
    address: value?.address || ''
  })

  const { location, loading, error, getCurrentLocation, clearLocation } = useLocation()

  const handleGetCurrentLocation = async () => {
    try {
      const currentLocation = await getCurrentLocation()
      onChange(currentLocation)
    } catch (error) {
      console.error('Error getting location:', error)
    }
  }

  const handleManualLocationChange = (field, newValue) => {
    const updatedLocation = { ...manualLocation, [field]: newValue }
    setManualLocation(updatedLocation)
    onChange(updatedLocation)
  }

  const handleClearLocation = () => {
    onChange(null)
    setManualLocation({ name: '', latitude: '', longitude: '', address: '' })
    clearLocation()
  }

  const toggleManualInput = () => {
    setShowManualInput(!showManualInput)
    if (!showManualInput) {
      setManualLocation({
        name: value?.name || '',
        latitude: value?.latitude || '',
        longitude: value?.longitude || '',
        address: value?.address || ''
      })
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <div className="flex space-x-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="flex items-center space-x-1"
          >
            <Navigation className="h-4 w-4" />
            <span>{loading ? 'Getting...' : 'Auto'}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={toggleManualInput}
            className="flex items-center space-x-1"
          >
            <MapPin className="h-4 w-4" />
            <span>Manual</span>
          </Button>
          {value && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClearLocation}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Current location display */}
      {value && !showManualInput && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 truncate">
                {value.name}
              </p>
              {value.address && (
                <p className="text-xs text-blue-700 mt-1 line-clamp-2">
                  {value.address}
                </p>
              )}
              <p className="text-xs text-blue-600 mt-1">
                {value.latitude?.toFixed(6)}, {value.longitude?.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual input form */}
      {showManualInput && (
        <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <Input
            label="Location Name"
            placeholder="Enter location name"
            value={manualLocation.name}
            onChange={(e) => handleManualLocationChange('name', e.target.value)}
          />
          
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              placeholder="e.g. -6.200000"
              type="number"
              step="any"
              value={manualLocation.latitude}
              onChange={(e) => handleManualLocationChange('latitude', e.target.value)}
            />
            <Input
              label="Longitude"
              placeholder="e.g. 106.816666"
              type="number"
              step="any"
              value={manualLocation.longitude}
              onChange={(e) => handleManualLocationChange('longitude', e.target.value)}
            />
          </div>
          
          <Input
            label="Address (Optional)"
            placeholder="Enter full address"
            value={manualLocation.address}
            onChange={(e) => handleManualLocationChange('address', e.target.value)}
          />
        </div>
      )}

      {/* No location selected */}
      {!value && !showManualInput && (
        <div className="p-4 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No location selected</p>
          <p className="text-xs text-gray-400 mt-1">
            Use Auto to detect current location or Manual to enter coordinates
          </p>
        </div>
      )}
    </div>
  )
}
