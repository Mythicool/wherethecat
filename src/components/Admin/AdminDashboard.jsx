import { useState, useEffect } from 'react'
import {
  Users,
  MapPin,
  Settings,
  BarChart3,
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext'
import CatManagement from './CatManagement'
import UserManagement from './UserManagement'
import AdminStats from './AdminStats'
import { firebaseCatService } from '../../services/firebaseCatService'
import './AdminDashboard.css'

function AdminDashboard() {
  const { user, userProfile } = useFirebaseAuth()
  const [activeTab, setActiveTab] = useState('cats')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState({
    totalCats: 0,
    activeCats: 0,
    totalUsers: 0,
    recentReports: 0
  })

  useEffect(() => {
    checkAdminStatus()
    loadStats()
  }, [user, userProfile])

  const checkAdminStatus = async () => {
    if (!user || !userProfile) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    try {
      // Check if user is admin from Firebase user profile
      setIsAdmin(userProfile?.isAdmin || false)
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Get cat statistics from Firebase
      const cats = await firebaseCatService.getAllCats()

      // Calculate stats
      const totalCats = cats?.length || 0
      const activeCats = cats?.filter(cat => cat.status === 'active').length || 0

      // Recent reports (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const recentReports = cats?.filter(cat =>
        new Date(cat.createdAt?.toDate?.() || cat.createdAt) > weekAgo
      ).length || 0

      setStats({
        totalCats,
        activeCats,
        totalUsers: 0, // TODO: Implement user count from Firebase Auth
        recentReports
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const refreshData = () => {
    loadStats()
    // Trigger refresh in child components
    window.dispatchEvent(new CustomEvent('adminRefresh'))
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Checking admin access...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="admin-access-denied">
        <Shield size={48} />
        <h2>Authentication Required</h2>
        <p>Please sign in to access the admin dashboard.</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <Shield size={48} />
        <h2>Access Denied</h2>
        <p>You don't have permission to access the admin dashboard.</p>
        <p>Contact an administrator if you believe this is an error.</p>
      </div>
    )
  }

  const tabs = [
    { id: 'cats', label: 'Cat Reports', icon: MapPin },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <Shield size={24} />
            <h1>Admin Dashboard</h1>
          </div>
          
          <div className="admin-header-actions">
            <button 
              className="admin-refresh-btn"
              onClick={refreshData}
              title="Refresh data"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div className="admin-stats-bar">
          <div className="admin-stat">
            <span className="admin-stat-value">{stats.totalCats}</span>
            <span className="admin-stat-label">Total Reports</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-value">{stats.activeCats}</span>
            <span className="admin-stat-label">Active</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-value">{stats.totalUsers}</span>
            <span className="admin-stat-label">Users</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-value">{stats.recentReports}</span>
            <span className="admin-stat-label">This Week</span>
          </div>
        </div>
      </div>

      <div className="admin-nav">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`admin-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="admin-content">
        {activeTab === 'cats' && <CatManagement onStatsUpdate={loadStats} />}
        {activeTab === 'users' && <UserManagement onStatsUpdate={loadStats} />}
        {activeTab === 'stats' && <AdminStats stats={stats} />}
        {activeTab === 'settings' && (
          <div className="admin-settings">
            <h2>Settings</h2>
            <p>Admin settings will be implemented here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
