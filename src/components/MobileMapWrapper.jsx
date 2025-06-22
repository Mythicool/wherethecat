import { useEffect, useRef, useState } from 'react'
import { Loader } from 'lucide-react'
import './MobileMapWrapper.css'

function MobileMapWrapper({ children, onMapReady }) {
  const containerRef = useRef()
  const [isReady, setIsReady] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let resizeTimeout = null

    // Function to calculate and set dimensions
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect()

      // Calculate dimensions with reasonable bounds
      let width = rect.width || window.innerWidth
      let height = rect.height || 300

      // Apply reasonable bounds to prevent extreme values
      width = Math.min(Math.max(width, 200), window.innerWidth * 2)
      height = Math.min(Math.max(height, 300), window.innerHeight * 2)

      const newDimensions = { width, height }

      // Only update if dimensions have changed significantly
      const hasChanged = Math.abs(newDimensions.width - dimensions.width) > 5 ||
                        Math.abs(newDimensions.height - dimensions.height) > 5

      if (hasChanged || !isReady) {
        setDimensions(newDimensions)

        // Mark as ready when we have valid dimensions
        if (newDimensions.width > 0 && newDimensions.height > 0) {
          setIsReady(true)
          if (onMapReady) {
            onMapReady(newDimensions)
          }
        }
      }
    }

    // Debounced update function
    const debouncedUpdate = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      resizeTimeout = setTimeout(updateDimensions, 50)
    }

    // Initial calculation
    updateDimensions()

    // Handle resize events with debouncing
    const resizeObserver = new ResizeObserver(debouncedUpdate)
    resizeObserver.observe(container)

    // Handle orientation changes on mobile
    const handleOrientationChange = () => {
      setTimeout(updateDimensions, 100)
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', debouncedUpdate)

    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      resizeObserver.disconnect()
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', debouncedUpdate)
    }
  }, [onMapReady, dimensions.width, dimensions.height, isReady])

  return (
    <div 
      ref={containerRef} 
      className="mobile-map-wrapper"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '300px',
        position: 'relative'
      }}
    >
      {!isReady && (
        <div className="mobile-map-loading">
          <Loader className="spinning" size={24} />
          <span>Loading map...</span>
        </div>
      )}
      
      <div 
        className={`mobile-map-content ${isReady ? 'ready' : 'loading'}`}
        style={{
          width: dimensions.width || '100%',
          height: dimensions.height || '100%',
          minHeight: '300px'
        }}
      >
        {isReady && children}
      </div>
    </div>
  )
}

export default MobileMapWrapper
