import { useState, useEffect } from 'react'
import { 
  Search, 
  Shield, 
  ShieldOff, 
  User, 
  Mail, 
  Calendar,
  MoreVertical
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './UserManagement.css'

function UserManagement({ onStatsUpdate }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadUsers()
    
    // Listen for refresh events
    const handleRefresh = () => loadUsers()
    window.addEventListener('adminRefresh', handleRefresh)
    
    return () => window.removeEventListener('adminRefresh', handleRefresh)
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (userId, currentAdminStatus) => {
    const newAdminStatus = !currentAdminStatus
    
    if (newAdminStatus) {
      if (!confirm('Are you sure you want to grant admin privileges to this user?')) {
        return
      }
    } else {
      if (!confirm('Are you sure you want to remove admin privileges from this user?')) {
        return
      }
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: newAdminStatus })
        .eq('id', userId)

      if (error) throw error

      // Log admin action (if function exists)
      try {
        await supabase.rpc('log_admin_action', {
          p_action_type: 'update',
          p_target_type: 'user',
          p_target_id: userId,
          p_new_values: { is_admin: newAdminStatus },
          p_notes: `Admin status ${newAdminStatus ? 'granted' : 'revoked'}`
        })
      } catch (logError) {
        console.log('Admin action logging not available:', logError)
      }

      loadUsers()
      onStatsUpdate?.()
    } catch (error) {
      console.error('Error updating user admin status:', error)
      alert('Failed to update user admin status')
    }
  }

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    )
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>User Management</h2>
        
        <div className="user-management-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="user-management-stats">
        <span>Showing {filteredUsers.length} of {users.length} users</span>
      </div>

      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Admin Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td className="user-info-cell">
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className="user-details">
                      <strong>{user.full_name || 'No name'}</strong>
                      <span className="user-id">ID: {user.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                </td>
                
                <td className="email-cell">
                  <div className="email-info">
                    <Mail size={14} />
                    <span>{user.email}</span>
                  </div>
                </td>
                
                <td className="admin-status-cell">
                  <div className={`admin-badge ${user.is_admin ? 'admin' : 'user'}`}>
                    {user.is_admin ? (
                      <>
                        <Shield size={14} />
                        <span>Admin</span>
                      </>
                    ) : (
                      <>
                        <User size={14} />
                        <span>User</span>
                      </>
                    )}
                  </div>
                </td>
                
                <td className="date-cell">
                  <div className="date-info">
                    <Calendar size={14} />
                    <span>{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </td>
                
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                      className={`admin-toggle-btn ${user.is_admin ? 'revoke' : 'grant'}`}
                      title={user.is_admin ? 'Remove admin privileges' : 'Grant admin privileges'}
                    >
                      {user.is_admin ? (
                        <ShieldOff size={14} />
                      ) : (
                        <Shield size={14} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="no-users">
          <User size={48} />
          <h3>No users found</h3>
          <p>No users match your current search.</p>
        </div>
      )}
    </div>
  )
}

export default UserManagement
