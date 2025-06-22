import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Archive
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import CatEditModal from './CatEditModal'
import './CatManagement.css'

function CatManagement({ onStatsUpdate }) {
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCat, setSelectedCat] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    loadCats()
    
    // Listen for refresh events
    const handleRefresh = () => loadCats()
    window.addEventListener('adminRefresh', handleRefresh)
    
    return () => window.removeEventListener('adminRefresh', handleRefresh)
  }, [])

  const loadCats = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('cats')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            email
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' })

      if (error) throw error

      setCats(data || [])
    } catch (error) {
      console.error('Error loading cats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (catId, newStatus) => {
    try {
      const { error } = await supabase
        .from('cats')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', catId)

      if (error) throw error

      // Log admin action (if function exists)
      try {
        await supabase.rpc('log_admin_action', {
          p_action_type: 'status_change',
          p_target_type: 'cat',
          p_target_id: catId,
          p_new_values: { status: newStatus },
          p_notes: `Status changed to ${newStatus}`
        })
      } catch (logError) {
        console.log('Admin action logging not available:', logError)
      }

      loadCats()
      onStatsUpdate?.()
    } catch (error) {
      console.error('Error updating cat status:', error)
      alert('Failed to update cat status')
    }
  }

  const handleDelete = async (catId) => {
    if (!confirm('Are you sure you want to delete this cat report? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('cats')
        .delete()
        .eq('id', catId)

      if (error) throw error

      // Log admin action (if function exists)
      try {
        await supabase.rpc('log_admin_action', {
          p_action_type: 'delete',
          p_target_type: 'cat',
          p_target_id: catId,
          p_notes: 'Cat report deleted by admin'
        })
      } catch (logError) {
        console.log('Admin action logging not available:', logError)
      }

      loadCats()
      onStatsUpdate?.()
    } catch (error) {
      console.error('Error deleting cat:', error)
      alert('Failed to delete cat report')
    }
  }

  const handleEdit = (cat) => {
    setSelectedCat(cat)
    setShowEditModal(true)
  }

  const handleEditSave = () => {
    setShowEditModal(false)
    setSelectedCat(null)
    loadCats()
    onStatsUpdate?.()
  }

  const filteredCats = cats.filter(cat => {
    const matchesSearch = !searchTerm || 
      cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.color?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || cat.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} className="status-icon active" />
      case 'rescued': return <CheckCircle size={16} className="status-icon rescued" />
      case 'adopted': return <CheckCircle size={16} className="status-icon adopted" />
      case 'inactive': return <XCircle size={16} className="status-icon inactive" />
      case 'archived': return <Archive size={16} className="status-icon archived" />
      case 'duplicate': return <AlertTriangle size={16} className="status-icon duplicate" />
      case 'inappropriate': return <AlertTriangle size={16} className="status-icon inappropriate" />
      default: return <CheckCircle size={16} className="status-icon" />
    }
  }

  const getReporterInfo = (cat) => {
    if (cat.profiles?.full_name) {
      return `${cat.profiles.full_name} (${cat.profiles.email})`
    } else if (cat.reporter_type === 'anonymous') {
      return 'Anonymous'
    } else {
      return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="cat-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading cat reports...</p>
      </div>
    )
  }

  return (
    <div className="cat-management">
      <div className="cat-management-header">
        <h2>Cat Report Management</h2>
        
        <div className="cat-management-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search cats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="rescued">Rescued</option>
            <option value="adopted">Adopted</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
            <option value="duplicate">Duplicate</option>
            <option value="inappropriate">Inappropriate</option>
          </select>
          
          <select 
            value={`${sortBy}-${sortOrder}`} 
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field)
              setSortOrder(order)
              loadCats()
            }}
            className="sort-select"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="status-asc">Status A-Z</option>
          </select>
        </div>
      </div>

      <div className="cat-management-stats">
        <span>Showing {filteredCats.length} of {cats.length} reports</span>
      </div>

      <div className="cat-table-container">
        <table className="cat-table">
          <thead>
            <tr>
              <th>Cat Info</th>
              <th>Location</th>
              <th>Reporter</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCats.map(cat => (
              <tr key={cat.id}>
                <td className="cat-info-cell">
                  <div className="cat-info">
                    <strong>{cat.name || 'Unnamed Cat'}</strong>
                    <div className="cat-details">
                      {cat.color && <span className="cat-color">{cat.color}</span>}
                      {cat.size && <span className="cat-size">{cat.size}</span>}
                    </div>
                    {cat.description && (
                      <div className="cat-description">
                        {cat.description.length > 100 
                          ? `${cat.description.substring(0, 100)}...`
                          : cat.description
                        }
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="location-cell">
                  <div className="location-info">
                    <MapPin size={14} />
                    <span>{cat.latitude?.toFixed(4)}, {cat.longitude?.toFixed(4)}</span>
                  </div>
                </td>
                
                <td className="reporter-cell">
                  <div className="reporter-info">
                    <User size={14} />
                    <span>{getReporterInfo(cat)}</span>
                  </div>
                </td>
                
                <td className="status-cell">
                  <div className="status-badge">
                    {getStatusIcon(cat.status)}
                    <span>{cat.status}</span>
                  </div>
                </td>
                
                <td className="date-cell">
                  <div className="date-info">
                    <Calendar size={14} />
                    <span>{new Date(cat.created_at).toLocaleDateString()}</span>
                  </div>
                </td>
                
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="action-btn edit-btn"
                      title="Edit cat"
                    >
                      <Edit size={14} />
                    </button>
                    
                    <select
                      value={cat.status}
                      onChange={(e) => handleStatusChange(cat.id, e.target.value)}
                      className="status-select"
                      title="Change status"
                    >
                      <option value="active">Active</option>
                      <option value="rescued">Rescued</option>
                      <option value="adopted">Adopted</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                      <option value="duplicate">Duplicate</option>
                      <option value="inappropriate">Inappropriate</option>
                    </select>
                    
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="action-btn delete-btn"
                      title="Delete cat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCats.length === 0 && (
        <div className="no-cats">
          <MapPin size={48} />
          <h3>No cats found</h3>
          <p>No cat reports match your current filters.</p>
        </div>
      )}

      {showEditModal && selectedCat && (
        <CatEditModal
          cat={selectedCat}
          onSave={handleEditSave}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCat(null)
          }}
        />
      )}
    </div>
  )
}

export default CatManagement
