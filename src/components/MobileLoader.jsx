import { useState, useEffect } from 'react'
import './MobileLoader.css'

function MobileLoader({ isLoading = true, message = "Loading...", progress = null }) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return ''
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div className="mobile-loader-overlay">
      <div className="mobile-loader-content">
        <div className="mobile-loader-spinner">
          <div className="cat-icon">🐱</div>
          <div className="spinner-ring"></div>
        </div>
        
        <div className="mobile-loader-text">
          <h3>{message}{dots}</h3>
          {progress !== null && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                ></div>
              </div>
              <span className="progress-text">{Math.round(progress)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MobileLoader
