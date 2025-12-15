import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// Plugin para mostrar mensaje visible cuando el servidor esté listo
const serverReadyPlugin = () => ({
  name: 'server-ready',
  configureServer(server: any) {
    server.httpServer?.once('listening', () => {
      // Delay de 7 segundos para que aparezca después del backend
      setTimeout(() => {
        const address = server.httpServer?.address()
        const port = typeof address === 'object' ? address?.port : 5173
        console.log('\n' + '='.repeat(60))
        console.log('🚀 FRONTEND is running on: http://localhost:' + port)
        console.log('='.repeat(60) + '\n')
      }, 7000)
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serverReadyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@widgets': path.resolve(__dirname, './src/widgets'),
      '@features': path.resolve(__dirname, './src/features'),
      '@entities': path.resolve(__dirname, './src/entities'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
