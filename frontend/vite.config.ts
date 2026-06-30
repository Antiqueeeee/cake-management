import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

// 后厨屏原型：前端独立运行，不依赖后端。后端 ready 后将 VITE_API_BASE_URL 指向真实地址即可联调。
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
      dts: 'auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
      dts: 'components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Element Plus 主题定制：给所有 .scss 头部注入 @use 本文件，
        // 让 EP 组件按需 SCSS 编译时拿到我们重写的 var.scss 变量。
        // 必须用函数形式跳过 element-plus.scss 自身——否则会形成自引用循环。
        additionalData(source: string, fp: string) {
          if (fp.endsWith('styles/element-plus.scss')) return source
          return `@use "@/styles/element-plus.scss" as *;\n${source}`
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
