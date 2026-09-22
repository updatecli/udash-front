import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { authGuard } from "@/composables/auth";
import { getAppBasePath, isAuthEnabled } from '@/composables/runtime'

// One table for every mode. Each route declares what it needs rather than which mode it
// belongs to, and the guard decides:
//   - `requiresRead`: a page of pipeline data, which a private instance withholds from
//     anonymous visitors and a public one does not.
//   - `requiresAuth`: an account page, which always needs a session.
const allRoutes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue')
  },
  {
    path: '/pipeline/reports',
    name: 'pipelineReports',
    component: () => import('../views/pipeline/ReportsView.vue'),
    meta: { requiresRead: true }
  },
  {
    path: '/pipeline/reports/:id',
    name: 'pipelineReport',
    component: () => import('../views/pipeline/ReportView.vue'),
    meta: { requiresRead: true }
  },
  {
    path: "/scm/dashboard",
    name: "scmDashboard",
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresRead: true }
  },
  {
    path: "/profile",
    name: "profile",
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: "/profile/tokens",
    name: "tokens",
    component: () => import('../views/TokensView.vue'),
    meta: { requiresAuth: true }
  }
]

// A route which always needs a session cannot exist on an instance with no login: a
// profile is a property of one, and API tokens exist to stand in for one. `requiresAuth`
// is therefore also what marks a route as unregistrable, rather than a second flag
// naming the same two routes.
const routes = allRoutes.filter((route) => isAuthEnabled || !route.meta?.requiresAuth)

const router = createRouter({
  history: createWebHistory(getAppBasePath()),
  routes,
  // The app shell lives in App.vue and does not unmount between routes, so the
  // document never collapses and the browser keeps the previous scroll offset.
  // Reset it explicitly, while still honouring back/forward restoration.
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

router.beforeEach(authGuard)

export default router
