import { useState } from 'react'
import { Search, Filter, X, Calendar, MapPin, Palette, Ruler } from 'lucide-react'
import './SearchFilters.css'

function SearchFilters({ onFiltersChange, onClose }) {
  const [filters, setFilters] = useState({
    searchText: '',
    color: '',
    size: '',
    dateFrom: '',
    dateTo: '',
    radius: 10 // km
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters = {
      searchText: '',
      color: '',
      size: '',
      dateFrom: '',
      dateTo: '',
      radius: 10
    }
    setFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 10
  )

  return (
    <div className="search-filters">
      <div className="search-filters-header">
        <div className="search-filters-title">
          <Filter className="filter-icon" />
          <h3>Search & Filter</h3>
        </div>
        <button className="close-filters" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="search-filters-content">
        {/* Search Text */}
        <div className="filter-group">
          <label>
            <Search className="filter-label-icon" />
            Search cats
          </label>
          <input
            type="text"
            placeholder="Search by name or description..."
            value={filters.searchText}
            onChange={(e) => handleChange('searchText', e.target.value)}
          />
        </div>

        {/* Quick Filters */}
        <div className="filter-row">
          <div className="filter-group">
            <label>
              <Palette className="filter-label-icon" />
              Color
            </label>
            <select
              value={filters.color}
              onChange={(e) => handleChange('color', e.target.value)}
            >
              <option value="">Any color</option>
              <option value="Black">Black</option>
              <option value="White">White</option>
              <option value="Orange/Ginger">Orange/Ginger</option>
              <option value="Gray">Gray</option>
              <option value="Brown">Brown</option>
              <option value="Calico">Calico</option>
              <option value="Tabby">Tabby</option>
              <option value="Tuxedo">Tuxedo</option>
              <option value="Tortoiseshell">Tortoiseshell</option>
              <option value="Mixed">Mixed</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              <Ruler className="filter-label-icon" />
              Size
            </label>
            <select
              value={filters.size}
              onChange={(e) => handleChange('size', e.target.value)}
            >
              <option value="">Any size</option>
              <option value="Kitten">Kitten</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </button>

        {showAdvanced && (
          <div className="advanced-filters">
            {/* Date Range */}
            <div className="filter-group">
              <label>
                <Calendar className="filter-label-icon" />
                Date Range
              </label>
              <div className="date-range">
                <input
                  type="date"
                  placeholder="From"
                  value={filters.dateFrom}
                  onChange={(e) => handleChange('dateFrom', e.target.value)}
                />
                <span>to</span>
                <input
                  type="date"
                  placeholder="To"
                  value={filters.dateTo}
                  onChange={(e) => handleChange('dateTo', e.target.value)}
                />
              </div>
            </div>

            {/* Location Radius */}
            <div className="filter-group">
              <label>
                <MapPin className="filter-label-icon" />
                Search Radius: {filters.radius} km
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.radius}
                onChange={(e) => handleChange('radius', parseInt(e.target.value))}
                className="radius-slider"
              />
              <div className="radius-labels">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button className="clear-filters" onClick={clearFilters}>
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  )
}

export default SearchFilters
