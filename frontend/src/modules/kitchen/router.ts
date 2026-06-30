/**
 * Kitchen 路由
 *
 * 路径前缀 /kitchen/*，登录后进入 /kitchen/board（详细设计 §4.2）
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/modules/kitchen/store'

const routes: RouteRecordRaw[] = [
  {
    path: '/kitchen/login',
    name: 'kitchen-login',
    component: () => import('./views/KitchenLoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/kitchen/board',
    name: 'kitchen-board',
    component: () => import('./views/KitchenBoardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/kitchen',
    redirect: '/kitchen/board',
  },
  {
    path: '/',
    redirect: '/kitchen/board',
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/kitchen/login',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth === false) return true
  const auth = useAuthStore()
  if (!auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      // ignore
    }
  }
  if (!auth.user) {
    return { name: 'kitchen-login', query: { redirect: to.fullPath } }
  }
  return true
})
