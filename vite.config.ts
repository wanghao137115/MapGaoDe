import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vite.dev/config
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // ==================== Web Worker + SharedArrayBuffer 支持 ====================
  // 注意：启用这些头需要确保服务器支持，
  // 如果使用在线 IDE 或远程开发环境，可能需要额外配置
  server: {
    headers: {
      // Cross-Origin-Opener-Policy: same-origin
      // 允许 Worker 使用 SharedArrayBuffer
      // 如果部署环境不支持，可以注释掉这行
      // 'Cross-Origin-Opener-Policy': 'same-origin',
      // 'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  // ==================== 构建优化 ====================
  build: {
    // 为 Worker 生成独立的 chunk
    rollupOptions: {
      output: {
        manualChunks: {
          worker: ['src/workers/**'],
        },
      },
    },
  },
});


