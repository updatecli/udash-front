import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PipelineReportsView from '../views/pipeline/ReportsView.vue'
import PipelineReportView from '../views/pipeline/ReportView.vue'
import ProfileView from "../views/ProfileView.vue";
import QuickStartView from "../views/QuickStart.vue";
import { createAuthGuard } from "@auth0/auth0-vue";

const isAuthEnabled = process.env.VUE_APP_AUTH_ENABLED === 'true';

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
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
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
      path: "/quickstart",
      name: "quickstart",
      component: QuickStartView
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
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
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
      path: "/quickstart",
      name: "quickstart",
      component: QuickStartView
    }
  ]

}

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
