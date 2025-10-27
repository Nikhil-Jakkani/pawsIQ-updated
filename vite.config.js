import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,ico,png,svg,webp,woff,woff2,webmanifest}'],
        globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js'],
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//], // Exclude API and auth routes
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          // Exclude auth endpoints from caching
          {
            urlPattern: /\/api\/.*\/auth\/.*/,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /\/api\/.*\/refresh.*/,
            handler: 'NetworkOnly'
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'PawsIQ - Pet Care Platform',
        short_name: 'PawsIQ',
        description: 'Complete pet care management platform with health tracking, appointment scheduling, and more.',
        theme_color: '#145ae6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        categories: ['pets', 'health', 'productivity', 'utilities'],
        screenshots: [
          {
            src: 'screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: 'screenshot-narrow.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      },
      devOptions: {
        enabled: true // Enable PWA in development
      }
    })
  ],
  server: {
    port: 3001,
    strictPort: false, // Allow fallback to another port if 3001 is in use
    open: true, // Open browser on server start
    hmr: {
      overlay: true, // Show errors as overlay
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api/v1': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser', // Use terser for better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor dependencies
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          charts: ['chart.js', 'react-chartjs-2'],
          ai: ['@google/generative-ai'],
        },
        // Optimize chunk naming and sizing
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
  // Ensure proper handling of CSS
  css: {
    devSourcemap: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@react-oauth/google', '@greatsumini/react-facebook-login'],
  },
  define: {
    'process.env': { ...env, VITE_API_URL: env.VITE_API_URL || '/api/v1' }
  }
}})
