import {createRouter, createWebHashHistory} from 'vue-router';
import type {RouteLocationNormalized} from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  // history: createWebHistory(import.meta.env.BASE_URL),
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      // query: dataset
      path: '/data',
      name: 'data',
      component: () => import('../views/DataView.vue'),
    },
    {
      // query: dataset
      path: '/scatter',
      name: 'scatter',
      component: () => import('../views/ScatterView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    }
  ],
});

function hasQueryParams(route: RouteLocationNormalized) {
  return !!Object.keys(route.query).length;
}

router.beforeEach((to, from, next) => {
  if (!hasQueryParams(to) && hasQueryParams(from)) {
    next({path: to.path, query: from.query});
  } else {
    next();
  }
});
export default router;
