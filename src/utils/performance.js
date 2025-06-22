// Performance monitoring utilities

export class PerformanceMonitor {
  constructor() {
    this.marks = new Map()
    this.measures = new Map()
  }

  // Start timing an operation
  startTiming(name) {
    const markName = `${name}-start`
    if (performance.mark) {
      performance.mark(markName)
    }
    this.marks.set(name, Date.now())
  }

  // End timing an operation and log the result
  endTiming(name) {
    const startTime = this.marks.get(name)
    if (!startTime) {
      console.warn(`No start time found for ${name}`)
      return
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // Use Performance API if available
    if (performance.mark && performance.measure) {
      const startMarkName = `${name}-start`
      const endMarkName = `${name}-end`
      const measureName = `${name}-duration`
      
      performance.mark(endMarkName)
      performance.measure(measureName, startMarkName, endMarkName)
    }

    this.measures.set(name, duration)
    console.log(`⏱️ ${name}: ${duration}ms`)
    
    // Warn about slow operations
    if (duration > 1000) {
      console.warn(`🐌 Slow operation detected: ${name} took ${duration}ms`)
    }

    return duration
  }

  // Get all measurements
  getAllMeasures() {
    return Object.fromEntries(this.measures)
  }

  // Clear all measurements
  clear() {
    this.marks.clear()
    this.measures.clear()
    if (performance.clearMarks) {
      performance.clearMarks()
    }
    if (performance.clearMeasures) {
      performance.clearMeasures()
    }
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor()

// Utility function to measure async operations
export async function measureAsync(name, asyncFn) {
  perfMonitor.startTiming(name)
  try {
    const result = await asyncFn()
    perfMonitor.endTiming(name)
    return result
  } catch (error) {
    perfMonitor.endTiming(name)
    throw error
  }
}

// Utility function to measure sync operations
export function measureSync(name, syncFn) {
  perfMonitor.startTiming(name)
  try {
    const result = syncFn()
    perfMonitor.endTiming(name)
    return result
  } catch (error) {
    perfMonitor.endTiming(name)
    throw error
  }
}

// Web Vitals monitoring (if available)
export function initWebVitals() {
  // Monitor Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        console.log('🎯 LCP:', lastEntry.startTime)
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      console.log('LCP monitoring not available')
    }

    // Monitor First Input Delay (FID)
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          console.log('⚡ FID:', entry.processingStart - entry.startTime)
        })
      })
      observer.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      console.log('FID monitoring not available')
    }

    // Monitor Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        console.log('📐 CLS:', clsValue)
      })
      observer.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      console.log('CLS monitoring not available')
    }
  }
}

// Memory usage monitoring
export function logMemoryUsage() {
  if (performance.memory) {
    const memory = performance.memory
    console.log('💾 Memory Usage:', {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`
    })
  }
}

// Bundle size analysis helper
export function logBundleInfo() {
  if (navigator.connection) {
    console.log('🌐 Connection:', {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    })
  }
}
