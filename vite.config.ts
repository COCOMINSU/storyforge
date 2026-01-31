import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // TipTap 에디터 (가장 큰 의존성)
          if (id.includes('@tiptap') || id.includes('prosemirror')) {
            return 'vendor-editor';
          }
          // 드래그앤드롭
          if (id.includes('@dnd-kit')) {
            return 'vendor-dnd';
          }
          // Supabase
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // 상태 관리 및 DB
          if (id.includes('zustand') || id.includes('dexie')) {
            return 'vendor-state';
          }
          // 유틸리티 라이브러리
          if (
            id.includes('date-fns') ||
            id.includes('jszip') ||
            id.includes('uuid')
          ) {
            return 'vendor-utils';
          }
          // React는 기본 번들에 포함
        },
      },
    },
    // 청크 크기 경고 조정
    chunkSizeWarningLimit: 500,
  },
});
