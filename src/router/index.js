import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PipelineReportsView from '../views/pipeline/ReportsView.vue'
import PipelineReportView from '../views/pipeline/ReportView.vue'
import ProfileView from "../views/ProfileView.vue";
import Dashboard from "../views/Dashboard.vue";
import { authGuard } from "@/composables/auth";
import { getAppBasePath, isAuthEnabled } from '@/composables/runtime'

let routes = []

if (isAuthEnabled) {
  routes = [
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
      beforeEnter: authGuard,
      path: '/pipeline/reports',
      name: 'pipelineReports',
      component: PipelineReportsView
    },
    {
      beforeEnter: authGuard,
      path: '/pipeline/reports/:id',
      name: 'pipelineReport',
      component: PipelineReportView
    },
    {
      beforeEnter: authGuard,
      path: "/profile",
      name: "profile",
      component: ProfileView
    },
    {
      beforeEnter: authGuard,
      path: "/scm/dashboard",
      name: "scmDashboard",
      component: Dashboard
    }
  ]
} else {
  routes = [
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
      component: PipelineReportsView
    },
    {
      path: '/pipeline/reports/:id',
      name: 'pipelineReport',
      component: PipelineReportView
    },
    {
      path: "/scm/dashboard",
      name: "scmDashboard",
      component: Dashboard
    }
  ]

}

const router = createRouter({
  history: createWebHistory(getAppBasePath()),
  routes
})

export default router
