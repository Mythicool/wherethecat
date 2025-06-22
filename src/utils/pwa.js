// PWA utilities for Where The Cat?

/**
 * Register service worker for PWA functionality
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      console.log('PWA: Registering service worker...')
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      console.log('PWA: Service worker registered successfully:', registration.scope)
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              console.log('PWA: New service worker available')
              showUpdateNotification()
            }
          })
        }
      })
      
      return registration
    } catch (error) {
      console.error('PWA: Service worker registration failed:', error)
      return null
    }
  } else {
    console.log('PWA: Service workers not supported')
    return null
  }
}

/**
 * Show update notification when new service worker is available
 */
function showUpdateNotification() {
  // Create a simple notification
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #667eea;
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 300px;
    cursor: pointer;
  `
  
  notification.innerHTML = `
    <div style="margin-bottom: 8px; font-weight: 500;">App Update Available</div>
    <div style="font-size: 12px; opacity: 0.9;">Tap to refresh and get the latest features</div>
  `
  
  notification.addEventListener('click', () => {
    window.location.reload()
  })
  
  document.body.appendChild(notification)
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  }, 10000)
}

/**
 * Check if app can be installed as PWA
 */
export function canInstallPWA() {
  return window.deferredPrompt !== null
}

/**
 * Show PWA install prompt
 */
export async function showInstallPrompt() {
  if (window.deferredPrompt) {
    try {
      // Show the install prompt
      window.deferredPrompt.prompt()
      
      // Wait for the user to respond
      const { outcome } = await window.deferredPrompt.userChoice
      
      console.log('PWA: Install prompt outcome:', outcome)
      
      // Clear the deferred prompt
      window.deferredPrompt = null
      
      return outcome === 'accepted'
    } catch (error) {
      console.error('PWA: Error showing install prompt:', error)
      return false
    }
  }
  
  return false
}

/**
 * Setup PWA install prompt handling
 */
export function setupInstallPrompt() {
  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (event) => {
    console.log('PWA: Install prompt available')
    
    // Prevent the mini-infobar from appearing on mobile
    event.preventDefault()
    
    // Save the event so it can be triggered later
    window.deferredPrompt = event
    
    // Show custom install button/banner
    showInstallBanner()
  })
  
  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA: App was installed')
    hideInstallBanner()
    
    // Clear the deferred prompt
    window.deferredPrompt = null
    
    // Track installation (analytics)
    if (window.gtag) {
      window.gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'App Installed'
      })
    }
  })
}

/**
 * Show install banner
 */
function showInstallBanner() {
  // Check if banner already exists
  if (document.getElementById('pwa-install-banner')) {
    return
  }
  
  const banner = document.createElement('div')
  banner.id = 'pwa-install-banner'
  banner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 400px;
    margin: 0 auto;
  `
  
  banner.innerHTML = `
    <div style="flex: 1;">
      <div style="font-weight: 500; margin-bottom: 4px; color: #2d3748;">Install Where The Cat?</div>
      <div style="font-size: 13px; color: #718096;">Add to your home screen for quick access</div>
    </div>
    <button id="pwa-install-btn" style="
      background: #667eea;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    ">Install</button>
    <button id="pwa-dismiss-btn" style="
      background: none;
      border: none;
      color: #718096;
      font-size: 18px;
      cursor: pointer;
      padding: 4px;
    ">×</button>
  `
  
  document.body.appendChild(banner)
  
  // Handle install button click
  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    const installed = await showInstallPrompt()
    if (installed) {
      hideInstallBanner()
    }
  })
  
  // Handle dismiss button click
  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    hideInstallBanner()
    
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now() + (7 * 24 * 60 * 60 * 1000))
  })
  
  // Check if user previously dismissed
  const dismissed = localStorage.getItem('pwa-install-dismissed')
  if (dismissed && Date.now() < parseInt(dismissed)) {
    hideInstallBanner()
  }
}

/**
 * Hide install banner
 */
function hideInstallBanner() {
  const banner = document.getElementById('pwa-install-banner')
  if (banner) {
    banner.remove()
  }
}

/**
 * Check if running as PWA
 */
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://')
}

/**
 * Get PWA display mode
 */
export function getPWADisplayMode() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone'
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen'
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui'
  }
  return 'browser'
}

/**
 * Initialize PWA functionality
 */
export function initializePWA() {
  console.log('PWA: Initializing...')
  
  // Register service worker
  registerServiceWorker()
  
  // Setup install prompt
  setupInstallPrompt()
  
  // Log PWA status
  console.log('PWA: Display mode:', getPWADisplayMode())
  console.log('PWA: Running as PWA:', isPWA())
  
  // Add PWA class to body for styling
  if (isPWA()) {
    document.body.classList.add('pwa-mode')
  }
}
