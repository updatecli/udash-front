import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PipelineReportsView from '../views/pipeline/ReportsView.vue'
import PipelineReportView from '../views/pipeline/ReportView.vue'
import PipelineConfigsView from '../views/config/ConfigsView.vue';
import PipelineConfigView from '../views/config/ConfigView.vue';
import ProfileView from "../views/ProfileView.vue";
import Dashboard from "../views/Dashboard.vue";
import { createAuthGuard } from "@auth0/auth0-vue";
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
      beforeEnter: createAuthGuard(),
      path: '/pipeline/configs',
      name: 'pipelineConfigs',
      component: PipelineConfigsView,
    },
    {
      beforeEnter: createAuthGuard(),
      path: '/pipeline/configs/source/:id',
      name: 'pipelineSourceConfig',
      component: PipelineConfigView,
    },
    {
      beforeEnter: createAuthGuard(),
      path: '/pipeline/configs/condition/:id',
      name: 'pipelineConditionConfig',
      component: PipelineConfigView,
    },
    {
      beforeEnter: createAuthGuard(),
      path: '/pipeline/configs/target/:id',
      name: 'pipelineTargetConfig',
      component: PipelineConfigView,
    },
    {
      beforeEnter: createAuthGuard(),
      path: '/pipeline/reports',
      name: 'pipelineReports',
      component: PipelineReportsView
    },
    {
      beforeEnter: createAuthGuard(),
      path: '/pipeline/reports/:id',
      name: 'pipelineReport',
      component: PipelineReportView
    },
    {
      beforeEnter: createAuthGuard(),
      path: "/profile",
      name: "profile",
      component: ProfileView
    },
    {
      beforeEnter: createAuthGuard(),
      path: "/scm/summary",
      name: "scmSummary",
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
      path: '/pipeline/configs',
      name: 'pipelineConfigs',
      component: PipelineConfigsView,
    },
    {
      path: '/pipeline/configs/source/:id',
      name: 'pipelineSourceConfig',
      component: PipelineConfigView,
    },
    {
      path: '/pipeline/configs/condition/:id',
      name: 'pipelineConditionConfig',
      component: PipelineConfigView,
    },
    {
      path: '/pipeline/configs/target/:id',
      name: 'pipelineTargetConfig',
      component: PipelineConfigView,
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
