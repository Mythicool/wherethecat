import { useState, useEffect } from 'react'
import { Edit, Trash2, MapPin, Calendar, Eye, X } from 'lucide-react'
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext'
import { firebaseCatService } from '../services/firebaseCatService'
// import { formatDistanceToNow } from 'date-fns'

// Simple date formatting function to avoid external dependency
const formatDistanceToNow = (date) => {
  const now = new Date()
  const diffInMs = now - date
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`
  } else {
    return `${diffInDays} days ago`
  }
}
import './UserReports.css'

function UserReports({ onClose }) {
  const { user } = useFirebaseAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)

  useEffect(() => {
    if (user) {
      loadUserReports()
    }
  }, [user])

  const loadUserReports = async () => {
    try {
      setLoading(true)
      setError('')
      const userReports = await firebaseCatService.getCatsByUser(user.uid)
      setReports(userReports)
    } catch (err) {
      console.error('Error loading user reports:', err)
      setError('Failed to load your reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this cat report?')) {
      return
    }

    try {
      await firebaseCatService.deleteCat(reportId)
      setReports(prev => prev.filter(report => report.id !== reportId))
      setSelectedReport(null)
    } catch (err) {
      console.error('Error deleting report:', err)
      alert('Failed to delete report. Please try again.')
    }
  }

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await firebaseCatService.updateCat(reportId, { status: newStatus })
      setReports(prev => prev.map(report =>
        report.id === reportId ? { ...report, status: newStatus } : report
      ))
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Failed to update status. Please try again.')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4299e1'
      case 'rescued': return '#48bb78'
      case 'adopted': return '#9f7aea'
      case 'inactive': return '#a0aec0'
      default: return '#4299e1'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Active'
      case 'rescued': return 'Rescued'
      case 'adopted': return 'Adopted'
      case 'inactive': return 'Inactive'
      default: return 'Active'
    }
  }

  if (loading) {
    return (
      <div className="user-reports-overlay" onClick={onClose}>
        <div className="user-reports-content" onClick={(e) => e.stopPropagation()}>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your reports...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="user-reports-overlay" onClick={onClose}>
      <div className="user-reports-content" onClick={(e) => e.stopPropagation()}>
        <div className="user-reports-header">
          <h2>My Cat Reports</h2>
          <button className="close-reports" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="reports-error">
            {error}
            <button onClick={loadUserReports} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {reports.length === 0 ? (
          <div className="no-reports">
            <MapPin className="no-reports-icon" />
            <h3>No reports yet</h3>
            <p>You haven't reported any cats yet. Click on the map to add your first report!</p>
            <p className="anonymous-note">
              Note: Anonymous reports (made before signing in) won't appear here.
            </p>
          </div>
        ) : (
          <div className="reports-list">
            {reports.map((report) => (
              <div key={report.id} className="report-item">
                {report.photo_urls && report.photo_urls.length > 0 && (
                  <div className="report-photo">
                    <img src={report.photo_urls[0]} alt={report.name || 'Cat'} />
                  </div>
                )}
                
                <div className="report-details">
                  <div className="report-header">
                    <h4>{report.name || 'Unnamed Cat'}</h4>
                    <div 
                      className="report-status"
                      style={{ backgroundColor: getStatusColor(report.status) }}
                    >
                      {getStatusLabel(report.status)}
                    </div>
                  </div>
                  
                  <p className="report-description">
                    {report.description || 'No description provided'}
                  </p>
                  
                  <div className="report-meta">
                    <div className="report-meta-item">
                      <Calendar size={14} />
                      <span>
                        {formatDistanceToNow(new Date(report.created_at))}
                      </span>
                    </div>
                    <div className="report-meta-item">
                      <MapPin size={14} />
                      <span>
                        {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="report-actions">
                  <button
                    className="action-button view-button"
                    onClick={() => setSelectedReport(report)}
                    title="View details"
                  >
                    <Eye size={16} />
                  </button>
                  
                  <select
                    value={report.status}
                    onChange={(e) => handleStatusChange(report.id, e.target.value)}
                    className="status-select"
                    title="Change status"
                  >
                    <option value="active">Active</option>
                    <option value="rescued">Rescued</option>
                    <option value="adopted">Adopted</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <button
                    className="action-button delete-button"
                    onClick={() => handleDeleteReport(report.id)}
                    title="Delete report"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedReport && (
          <div className="report-detail-overlay" onClick={() => setSelectedReport(null)}>
            <div className="report-detail-content" onClick={(e) => e.stopPropagation()}>
              <div className="report-detail-header">
                <h3>{selectedReport.name || 'Unnamed Cat'}</h3>
                <button onClick={() => setSelectedReport(null)}>
                  <X size={20} />
                </button>
              </div>
              
              {selectedReport.photo_urls && selectedReport.photo_urls.length > 0 && (
                <div className="report-detail-photos">
                  {selectedReport.photo_urls.map((url, index) => (
                    <img key={index} src={url} alt={`Cat photo ${index + 1}`} />
                  ))}
                </div>
              )}
              
              <div className="report-detail-info">
                <p><strong>Description:</strong> {selectedReport.description || 'No description'}</p>
                <p><strong>Color:</strong> {selectedReport.color || 'Not specified'}</p>
                <p><strong>Size:</strong> {selectedReport.size || 'Not specified'}</p>
                <p><strong>Date Spotted:</strong> {selectedReport.date_spotted || 'Not specified'}</p>
                <p><strong>Status:</strong> {getStatusLabel(selectedReport.status)}</p>
                <p><strong>Location:</strong> {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}</p>
                <p><strong>Reported:</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserReports
