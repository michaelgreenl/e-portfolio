import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ProjectsView from '../views/ProjectsView.vue';

const DEFAULT_TITLE = 'M. Green';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Home' },
    },
    {
      path: '/projects',
      name: 'proejcts',
      component: ProjectsView,
      meta: { title: 'Projects' },
    },
  ],

  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      };
    } else if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

router.beforeEach((to, from, next) => {
  const redirectPath = sessionStorage.getItem('redirect');
  sessionStorage.removeItem('redirect');

  if (to.path === '/' && redirectPath) {
    next({ path: redirectPath, replace: true });
  } else {
    next();
  }
});

router.afterEach((to) => {
  let title = DEFAULT_TITLE;

  title += ' | ' + to.meta.title;

  document.title = title;
});

export default router;
