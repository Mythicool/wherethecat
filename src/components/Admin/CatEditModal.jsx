import { useState, useEffect } from 'react'
import { X, Save, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './CatEditModal.css'

function CatEditModal({ cat, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '',
    size: '',
    status: 'active',
    latitude: '',
    longitude: '',
    admin_notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (cat) {
      setFormData({
        name: cat.name || '',
        description: cat.description || '',
        color: cat.color || '',
        size: cat.size || '',
        status: cat.status || 'active',
        latitude: cat.latitude || '',
        longitude: cat.longitude || '',
        admin_notes: cat.admin_notes || ''
      })
    }
  }, [cat])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const updateData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('cats')
        .update(updateData)
        .eq('id', cat.id)

      if (updateError) throw updateError

      // Log admin action (if function exists)
      try {
        await supabase.rpc('log_admin_action', {
          p_action_type: 'update',
          p_target_type: 'cat',
          p_target_id: cat.id,
          p_new_values: updateData,
          p_notes: 'Cat details updated by admin'
        })
      } catch (logError) {
        console.log('Admin action logging not available:', logError)
      }

      onSave()
    } catch (error) {
      console.error('Error updating cat:', error)
      setError('Failed to update cat. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="cat-edit-modal-overlay">
      <div className="cat-edit-modal">
        <div className="cat-edit-modal-header">
          <h3>Edit Cat Report</h3>
          <button 
            onClick={onClose}
            className="close-btn"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cat-edit-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Cat Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter cat name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="active">Active</option>
                <option value="rescued">Rescued</option>
                <option value="adopted">Adopted</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
                <option value="duplicate">Duplicate</option>
                <option value="inappropriate">Inappropriate</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the cat..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="color">Color</label>
              <select
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
              >
                <option value="">Select color</option>
                <option value="Black">Black</option>
                <option value="White">White</option>
                <option value="Gray">Gray</option>
                <option value="Orange/Ginger">Orange/Ginger</option>
                <option value="Brown/Tabby">Brown/Tabby</option>
                <option value="Calico">Calico</option>
                <option value="Tortoiseshell">Tortoiseshell</option>
                <option value="Tuxedo">Tuxedo</option>
                <option value="Mixed">Mixed</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="size">Size</label>
              <select
                id="size"
                name="size"
                value={formData.size}
                onChange={handleChange}
              >
                <option value="">Select size</option>
                <option value="Kitten">Kitten</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitude">
                <MapPin size={16} />
                Latitude
              </label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                step="any"
                placeholder="35.4676"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="longitude">
                <MapPin size={16} />
                Longitude
              </label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                step="any"
                placeholder="-97.5164"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="admin_notes">Admin Notes</label>
            <textarea
              id="admin_notes"
              name="admin_notes"
              value={formData.admin_notes}
              onChange={handleChange}
              rows={2}
              placeholder="Internal notes for administrators..."
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={loading}
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CatEditModal
