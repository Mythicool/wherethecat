import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  Activity
} from 'lucide-react'
import { firebaseCatService } from '../../services/firebaseCatService'
import './AdminStats.css'

function AdminStats({ stats }) {
  const [detailedStats, setDetailedStats] = useState({
    catsByStatus: {},
    catsByMonth: {},
    userGrowth: {},
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDetailedStats()
  }, [])

  const loadDetailedStats = async () => {
    try {
      setLoading(true)

      // Get cats by status
      const { data: cats, error: catsError } = await supabase
        .from('cats')
        .select('status, created_at')

      if (catsError) throw catsError

      // Get users by month
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('created_at')

      if (profilesError) throw profilesError

      // Process cats by status
      const catsByStatus = {}
      cats?.forEach(cat => {
        catsByStatus[cat.status] = (catsByStatus[cat.status] || 0) + 1
      })

      // Process cats by month (last 6 months)
      const catsByMonth = {}
      const usersByMonth = {}
      const now = new Date()
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        catsByMonth[monthKey] = 0
        usersByMonth[monthKey] = 0
      }

      cats?.forEach(cat => {
        const date = new Date(cat.created_at)
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        if (catsByMonth.hasOwnProperty(monthKey)) {
          catsByMonth[monthKey]++
        }
      })

      profiles?.forEach(profile => {
        const date = new Date(profile.created_at)
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        if (usersByMonth.hasOwnProperty(monthKey)) {
          usersByMonth[monthKey]++
        }
      })

      setDetailedStats({
        catsByStatus,
        catsByMonth,
        userGrowth: usersByMonth,
        recentActivity: [] // Could be populated with admin_actions if available
      })
    } catch (error) {
      console.error('Error loading detailed stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      active: '#38a169',
      rescued: '#3182ce',
      adopted: '#805ad5',
      inactive: '#e53e3e',
      archived: '#718096',
      duplicate: '#d69e2e',
      inappropriate: '#e53e3e'
    }
    return colors[status] || '#718096'
  }

  if (loading) {
    return (
      <div className="admin-stats-loading">
        <div className="loading-spinner"></div>
        <p>Loading statistics...</p>
      </div>
    )
  }

  return (
    <div className="admin-stats">
      <div className="stats-header">
        <h2>Statistics & Analytics</h2>
      </div>

      <div className="stats-grid">
        {/* Overview Cards */}
        <div className="stat-card overview">
          <div className="stat-card-header">
            <h3>Overview</h3>
            <BarChart3 size={20} />
          </div>
          <div className="stat-metrics">
            <div className="metric">
              <span className="metric-value">{stats.totalCats}</span>
              <span className="metric-label">Total Reports</span>
            </div>
            <div className="metric">
              <span className="metric-value">{stats.activeCats}</span>
              <span className="metric-label">Active Cats</span>
            </div>
            <div className="metric">
              <span className="metric-value">{stats.totalUsers}</span>
              <span className="metric-label">Registered Users</span>
            </div>
            <div className="metric">
              <span className="metric-value">{stats.recentReports}</span>
              <span className="metric-label">This Week</span>
            </div>
          </div>
        </div>

        {/* Cats by Status */}
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Reports by Status</h3>
            <MapPin size={20} />
          </div>
          <div className="status-chart">
            {Object.entries(detailedStats.catsByStatus).map(([status, count]) => (
              <div key={status} className="status-bar">
                <div className="status-info">
                  <span className="status-name">{status}</span>
                  <span className="status-count">{count}</span>
                </div>
                <div className="status-progress">
                  <div 
                    className="status-fill"
                    style={{
                      width: `${(count / stats.totalCats) * 100}%`,
                      backgroundColor: getStatusColor(status)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="stat-card wide">
          <div className="stat-card-header">
            <h3>Monthly Trends</h3>
            <TrendingUp size={20} />
          </div>
          <div className="trend-chart">
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color cats"></div>
                <span>Cat Reports</span>
              </div>
              <div className="legend-item">
                <div className="legend-color users"></div>
                <span>New Users</span>
              </div>
            </div>
            <div className="chart-bars">
              {Object.entries(detailedStats.catsByMonth).map(([month, catCount]) => {
                const userCount = detailedStats.userGrowth[month] || 0
                const maxValue = Math.max(
                  ...Object.values(detailedStats.catsByMonth),
                  ...Object.values(detailedStats.userGrowth)
                )
                
                return (
                  <div key={month} className="chart-month">
                    <div className="chart-bars-container">
                      <div 
                        className="chart-bar cats"
                        style={{ height: `${(catCount / maxValue) * 100}%` }}
                        title={`${catCount} cat reports`}
                      />
                      <div 
                        className="chart-bar users"
                        style={{ height: `${(userCount / maxValue) * 100}%` }}
                        title={`${userCount} new users`}
                      />
                    </div>
                    <div className="chart-month-label">{month}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Quick Actions</h3>
            <Activity size={20} />
          </div>
          <div className="quick-actions">
            <button className="quick-action-btn">
              <MapPin size={16} />
              Export Cat Data
            </button>
            <button className="quick-action-btn">
              <Users size={16} />
              Export User Data
            </button>
            <button className="quick-action-btn">
              <BarChart3 size={16} />
              Generate Report
            </button>
            <button className="quick-action-btn">
              <Calendar size={16} />
              Schedule Cleanup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminStats
