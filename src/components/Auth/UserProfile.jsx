import { useState } from 'react'
import { User, LogOut, Settings, Download, MapPin } from 'lucide-react'
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext'
import { firebaseCatService } from '../../services/firebaseCatService'
import UserReports from '../UserReports'
import './UserProfile.css'

function UserProfile({ onClose }) {
  const { user, userProfile, signOut } = useFirebaseAuth()
  const [loading, setLoading] = useState(false)
  const [showReports, setShowReports] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut()
      onClose()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async (format) => {
    if (!user) return

    setLoading(true)
    try {
      const userCats = await firebaseCatService.getCatsByUser(user.uid)

      let data
      if (format === 'csv') {
        const headers = ['Name', 'Description', 'Color', 'Size', 'Date Spotted', 'Latitude', 'Longitude', 'Status']
        const csvRows = [headers.join(',')]

        userCats.forEach(cat => {
          const row = [
            cat.name || '',
            cat.description || '',
            cat.color || '',
            cat.size || '',
            cat.dateSpotted || '',
            cat.latitude || '',
            cat.longitude || '',
            cat.status || ''
          ]
          csvRows.push(row.map(field => `"${field}"`).join(','))
        })

        data = csvRows.join('\n')
      } else {
        data = JSON.stringify(userCats, null, 2)
      }

      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `my-cat-reports.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-content" onClick={(e) => e.stopPropagation()}>
        <div className="user-profile-header">
          <div className="user-avatar">
            <User className="user-avatar-icon" />
          </div>
          <div className="user-info">
            <h3>{user?.displayName || userProfile?.displayName || 'User'}</h3>
            <p>{user?.email || (user?.isAnonymous ? 'Anonymous User' : 'No email')}</p>
          </div>
        </div>

        <div className="user-profile-menu">
          <button className="profile-menu-item" disabled>
            <Settings className="menu-icon" />
            <span>Settings</span>
            <span className="coming-soon">Coming Soon</span>
          </button>

          <button
            className="profile-menu-item"
            onClick={() => setShowReports(true)}
          >
            <MapPin className="menu-icon" />
            <span>My Reports</span>
          </button>

          <div className="profile-menu-section">
            <h4>Export Data</h4>
            <button 
              className="profile-menu-item"
              onClick={() => handleExportData('json')}
              disabled={loading}
            >
              <Download className="menu-icon" />
              <span>Export as JSON</span>
            </button>

            <button 
              className="profile-menu-item"
              onClick={() => handleExportData('csv')}
              disabled={loading}
            >
              <Download className="menu-icon" />
              <span>Export as CSV</span>
            </button>
          </div>

          <button 
            className="profile-menu-item sign-out"
            onClick={handleSignOut}
            disabled={loading}
          >
            <LogOut className="menu-icon" />
            <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>

      {showReports && (
        <UserReports onClose={() => setShowReports(false)} />
      )}
    </div>
  )
}

export default UserProfile
