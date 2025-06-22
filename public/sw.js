// Service Worker for Where The Cat? PWA
const CACHE_NAME = 'wherethecat-v1.0.1'
const STATIC_CACHE_NAME = 'wherethecat-static-v1.0.1'
const DYNAMIC_CACHE_NAME = 'wherethecat-dynamic-v1.0.1'

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets as needed
]

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /^https:\/\/firestore\.googleapis\.com/,
]

// API endpoints that should NOT be cached (CORS/CSP issues)
const NO_CACHE_PATTERNS = [
  /^https:\/\/nominatim\.openstreetmap\.org/,
  /^https:\/\/apis\.google\.com/,
  /^https:\/\/accounts\.google\.com/,
  /^https:\/\/www\.gstatic\.com/,
  /^https:\/\/ssl\.gstatic\.com/,
  /^https:\/\/www\.google\.com/,
  /^https:\/\/.*\.googleapis\.com/,
  /^https:\/\/.*\.firebaseapp\.com/,
  /^https:\/\/securetoken\.googleapis\.com/,
  /^https:\/\/identitytoolkit\.googleapis\.com/,
  /^https:\/\/firestore\.googleapis\.com/,
  // Add any Google API script loading patterns
  /apis\.google\.com.*onload=/,
  /gstatic\.com/,
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker: Static files cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return
  }

  // Skip service worker for problematic APIs (CORS/CSP issues) - do this early
  if (shouldSkipCache(request)) {
    return // Let the browser handle it directly
  }

  event.respondWith(
    handleFetch(request)
  )
})

async function handleFetch(request) {
  const url = new URL(request.url)

  try {
    // Strategy 1: Static files - Cache First
    if (isStaticFile(request)) {
      return await cacheFirst(request, STATIC_CACHE_NAME)
    }

    // Strategy 2: API calls - Network First with cache fallback
    if (isAPICall(request)) {
      return await networkFirst(request, DYNAMIC_CACHE_NAME)
    }

    // Strategy 3: Images and assets - Cache First
    if (isAsset(request)) {
      return await cacheFirst(request, DYNAMIC_CACHE_NAME)
    }

    // Strategy 4: Everything else - Network First
    return await networkFirst(request, DYNAMIC_CACHE_NAME)

  } catch (error) {
    console.error('Service Worker: Fetch error:', error)

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await getOfflinePage()
    }

    // Return cached version if available
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return network error
    return new Response('Network error', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

// Cache First strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
    }).catch(() => {
      // Ignore network errors for background updates
    })
    
    return cachedResponse
  }
  
  // Not in cache, fetch from network
  const networkResponse = await fetch(request)
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone())
  }
  
  return networkResponse
}

// Network First strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Helper functions
function isStaticFile(request) {
  const url = new URL(request.url)
  return STATIC_FILES.some(file => url.pathname === file) ||
         url.pathname.endsWith('.html') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js')
}

function isAPICall(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))
}

function shouldSkipCache(request) {
  return NO_CACHE_PATTERNS.some(pattern => pattern.test(request.url))
}

function isAsset(request) {
  const url = new URL(request.url)
  return url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf)$/)
}

async function getOfflinePage() {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME)
    const offlinePage = await cache.match('/')
    
    if (offlinePage) {
      return offlinePage
    }
  } catch (error) {
    console.error('Service Worker: Error getting offline page:', error)
  }
  
  // Return basic offline page
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Where The Cat? - Offline</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          text-align: center; 
          padding: 50px; 
          background: #f8f9fa;
        }
        .offline-container {
          max-width: 400px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .cat-icon { font-size: 48px; margin-bottom: 20px; }
        h1 { color: #667eea; margin-bottom: 16px; }
        p { color: #666; line-height: 1.5; }
        .retry-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="cat-icon">🐱</div>
        <h1>You're Offline</h1>
        <p>Where The Cat? needs an internet connection to show the latest cat reports.</p>
        <p>Please check your connection and try again.</p>
        <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}

// Background sync for offline cat reports (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'cat-report-sync') {
    event.waitUntil(syncCatReports())
  }
})

async function syncCatReports() {
  // TODO: Implement background sync for offline cat reports
  console.log('Service Worker: Syncing offline cat reports...')
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'New cat sighting in your area!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'cat-notification',
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'View on Map',
          icon: '/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/action-dismiss.png'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Where The Cat?', options)
    )
  }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
