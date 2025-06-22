import './LoadingSkeleton.css'

function LoadingSkeleton({ type = 'default', count = 1 }) {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div key={index} className={`skeleton skeleton-${type}`}>
      {type === 'card' && (
        <>
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text short"></div>
          </div>
        </>
      )}
      {type === 'map' && (
        <div className="skeleton-map">
          <div className="skeleton-map-controls"></div>
          <div className="skeleton-map-markers">
            <div className="skeleton-marker"></div>
            <div className="skeleton-marker"></div>
            <div className="skeleton-marker"></div>
          </div>
        </div>
      )}
      {type === 'form' && (
        <div className="skeleton-form">
          <div className="skeleton-form-title"></div>
          <div className="skeleton-input"></div>
          <div className="skeleton-input"></div>
          <div className="skeleton-input large"></div>
          <div className="skeleton-buttons">
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
          </div>
        </div>
      )}
    </div>
  ))

  return <div className="skeleton-container">{skeletons}</div>
}

export default LoadingSkeleton
