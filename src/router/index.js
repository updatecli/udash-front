import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PipelinesView from '../views/PipelinesView.vue'
import PipelineView from '../views/PipelineView.vue'
import ProfileView from "../views/ProfileView.vue";
import { createAuthGuard } from "@auth0/auth0-vue";

const routes = [
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
    path: '/pipelines',
    name: 'pipelines',
    component: PipelinesView
  },
  {
    beforeEnter: createAuthGuard(),
    path: '/pipelines/:id',
    name: 'pipeline',
    component: PipelineView
  },
  {
    beforeEnter: createAuthGuard(),
    path: "/profile",
    name: "profile",
    component: ProfileView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
