import { useState, useEffect } from 'react'
import { geolocationService } from '../services/geolocationService'
import './MobileDebugInfo.css'

function MobileDebugInfo() {
  const [debugInfo, setDebugInfo] = useState({})
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    const info = {
      userAgent: navigator.userAgent,
      geolocationSupported: geolocationService.isSupported(),
      isMobile: geolocationService.isMobile(),
      isIOSSafari: geolocationService.isIOSSafari(),
      protocol: window.location.protocol,
      host: window.location.host,
      permissions: 'permissions' in navigator,
      timestamp: new Date().toISOString()
    }

    // Check permissions if available
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(permission => {
          setDebugInfo({
            ...info,
            permissionState: permission.state
          })
        })
        .catch(() => {
          setDebugInfo({
            ...info,
            permissionState: 'unavailable'
          })
        })
    } else {
      setDebugInfo(info)
    }
  }, [])

  // Only show debug info in development or if there are issues
  const shouldShow = process.env.NODE_ENV === 'development' || 
                    window.location.search.includes('debug=true') ||
                    showDebug

  if (!shouldShow && !showDebug) {
    return (
      <button 
        className="debug-toggle"
        onClick={() => setShowDebug(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: '#ff6b6b',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 10000
        }}
      >
        🐛
      </button>
    )
  }

  return (
    <div className="mobile-debug-info">
      <div className="debug-header">
        <h4>🐛 Debug Info</h4>
        <button onClick={() => setShowDebug(false)}>×</button>
      </div>
      
      <div className="debug-content">
        <div className="debug-section">
          <h5>Device Info</h5>
          <p><strong>Mobile:</strong> {debugInfo.isMobile ? 'Yes' : 'No'}</p>
          <p><strong>iOS Safari:</strong> {debugInfo.isIOSSafari ? 'Yes' : 'No'}</p>
          <p><strong>Protocol:</strong> {debugInfo.protocol}</p>
          <p><strong>Host:</strong> {debugInfo.host}</p>
        </div>

        <div className="debug-section">
          <h5>Geolocation Support</h5>
          <p><strong>Supported:</strong> {debugInfo.geolocationSupported ? 'Yes' : 'No'}</p>
          <p><strong>Permissions API:</strong> {debugInfo.permissions ? 'Yes' : 'No'}</p>
          <p><strong>Permission State:</strong> {debugInfo.permissionState || 'Unknown'}</p>
        </div>

        <div className="debug-section">
          <h5>User Agent</h5>
          <p style={{ fontSize: '10px', wordBreak: 'break-all' }}>
            {debugInfo.userAgent}
          </p>
        </div>

        <div className="debug-section">
          <h5>Test Geolocation</h5>
          <button 
            onClick={async () => {
              try {
                console.log('Testing geolocation...')
                const position = await geolocationService.getMobilePosition()
                alert(`Success! Lat: ${position.lat}, Lng: ${position.lng}, Accuracy: ${position.accuracy}m`)
              } catch (error) {
                alert(`Error: ${error.message}`)
              }
            }}
            style={{
              background: '#4299e1',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Location
          </button>
        </div>

        <div className="debug-section">
          <h5>Instructions</h5>
          {debugInfo.isIOSSafari && (
            <div style={{ background: '#fef5e7', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
              <strong>iOS Safari:</strong>
              <ol style={{ margin: '4px 0', paddingLeft: '16px' }}>
                <li>Go to Settings → Safari → Location Services</li>
                <li>Enable "While Using App"</li>
                <li>Refresh this page</li>
                <li>Tap "Use My Location" button</li>
              </ol>
            </div>
          )}
          
          {debugInfo.isMobile && !debugInfo.isIOSSafari && (
            <div style={{ background: '#e6fffa', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
              <strong>Mobile Chrome:</strong>
              <ol style={{ margin: '4px 0', paddingLeft: '16px' }}>
                <li>Ensure location services are enabled</li>
                <li>Allow location when prompted</li>
                <li>Try moving to an open area</li>
              </ol>
            </div>
          )}
        </div>

        <div className="debug-section">
          <small>Generated: {debugInfo.timestamp}</small>
        </div>
      </div>
    </div>
  )
}

export default MobileDebugInfo
