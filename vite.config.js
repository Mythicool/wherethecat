import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],





  // Build optimizations for mobile performance
  build: {
    // Generate source maps for debugging in production
    sourcemap: true,

    // Target modern browsers for smaller bundles
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],

    // Optimize chunk splitting for mobile
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
          utils: ['date-fns', 'lucide-react', 'react-hook-form']
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },

    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500, // Smaller for mobile

    // Minify for production with mobile optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'], // Remove specific console methods
        passes: 2 // Multiple passes for better compression
      },
      mangle: {
        safari10: true // Fix Safari 10 issues
      }
    },

    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true,

    // Asset optimization
    assetsInlineLimit: 4096, // Inline small assets

    // Reduce bundle size
    reportCompressedSize: true
  },

  // Development server configuration
  server: {
    port: 5173,
    host: true, // Allow external connections
    open: true  // Auto-open browser
  },

  // Preview server configuration
  preview: {
    port: 3000,
    host: true
  },

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    global: 'globalThis'
  }
})
