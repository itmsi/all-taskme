import { useState, useEffect, useCallback, memo } from 'react'
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

export default memo(function ImagePreviewModal({ 
  isOpen, 
  onClose, 
  images = [], 
  currentIndex = 0, 
  onIndexChange 
}) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })

  const currentImage = images[currentIndex]

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setZoom(100)
      setRotation(0)
      setImagePosition({ x: 0, y: 0 })
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          if (currentIndex > 0) {
            onIndexChange(currentIndex - 1)
          }
          break
        case 'ArrowRight':
          if (currentIndex < images.length - 1) {
            onIndexChange(currentIndex + 1)
          }
          break
        case '+':
        case '=':
          setZoom(prev => Math.min(prev + 25, 500))
          break
        case '-':
          setZoom(prev => Math.max(prev - 25, 25))
          break
        case 'r':
        case 'R':
          setRotation(prev => (prev + 90) % 360)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, images.length, onClose, onIndexChange])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 500))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 25))
  }, [])

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  const handleReset = useCallback(() => {
    setZoom(100)
    setRotation(0)
    setImagePosition({ x: 0, y: 0 })
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (zoom > 100) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
    }
  }, [zoom, imagePosition])

  const handleMouseMove = useCallback((e) => {
    if (isDragging && zoom > 100) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, zoom, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDownload = useCallback(async () => {
    if (!currentImage) return

    try {
      const response = await fetch(currentImage.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = currentImage.name || 'image'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
    }
  }, [currentImage])

  if (!isOpen || !currentImage) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium truncate max-w-md">
              {currentImage.name}
            </h3>
            <span className="text-sm text-gray-300">
              {currentIndex + 1} of {images.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium min-w-12 text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Rotate (R)"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => onIndexChange(currentIndex - 1)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
              title="Previous (←)"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          
          {currentIndex < images.length - 1 && (
            <button
              onClick={() => onIndexChange(currentIndex + 1)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
              title="Next (→)"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </>
      )}

      {/* Image Container */}
      <div 
        className="flex items-center justify-center w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative max-w-full max-h-full"
          style={{
            transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <img
            src={currentImage.url}
            alt={currentImage.name}
            className="max-w-full max-h-full object-contain"
            style={{ 
              maxHeight: 'calc(100vh - 120px)',
              maxWidth: 'calc(100vw - 120px)'
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex justify-center space-x-2 overflow-x-auto max-w-full">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => onIndexChange(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-white' 
                    : 'border-transparent hover:border-gray-400'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="absolute bottom-4 right-4 z-10 px-4 py-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-lg transition-all text-sm"
        title="Reset View"
      >
        Reset View
      </button>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 text-white text-sm opacity-70">
        <div>← → Navigate • + - Zoom • R Rotate • Esc Close</div>
      </div>
    </div>
  )
})
