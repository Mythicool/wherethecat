import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

describe('App', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
  })

  it('renders the main components', () => {
    render(<App />)
    
    // Check if header is rendered
    expect(screen.getByText('Where The Cat?')).toBeInTheDocument()
    expect(screen.getByText('Community Cat Tracking')).toBeInTheDocument()
    
    // Check if stats are rendered
    expect(screen.getByText('Cats Reported')).toBeInTheDocument()
    
    // Check if instructions are rendered
    expect(screen.getByText(/Click anywhere on the map to report/)).toBeInTheDocument()
    expect(screen.getByText(/Help build a community-driven database/)).toBeInTheDocument()
  })

  it('displays correct initial cat count', () => {
    localStorageMock.getItem.mockReturnValue(null)
    render(<App />)
    
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('loads cats from localStorage', () => {
    const mockCats = [
      {
        id: 1,
        name: 'Test Cat',
        location: { lat: 35.4676, lng: -97.5164 },
        dateAdded: '2023-01-01T00:00:00.000Z'
      }
    ]
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCats))
    
    render(<App />)
    
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
