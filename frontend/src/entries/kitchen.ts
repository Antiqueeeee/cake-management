/**
 * Kitchen 入口
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '../modules/kitchen/App.vue'
import { router } from '../modules/kitchen/router'
import '@/styles/global.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
