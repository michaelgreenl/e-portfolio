import { markRaw } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import HomeIcon from '@/components/SVGs/Views/HomeIcon.vue';
import HomeIconFill from '@/components/SVGs/Views/HomeIconFill.vue';
import ProjectsIcon from '@/components/SVGs/Views/ProjectsIcon.vue';
import ResumeIcon from '@/components/SVGs/Views/ResumeIcon.vue';
import ResumeIconFill from '@/components/SVGs/Views/ResumeIconFill.vue';
import ContactIcon from '@/components/SVGs/Views/ContactIcon.vue';
import ContactIconFill from '@/components/SVGs/Views/ContactIconFill.vue';
import ResumeView from '@/views/ResumeView.vue';

export const navigationRoutes = {
    home: {
        path: '/',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: 'Portfolio', icon: markRaw(HomeIcon), iconFill: markRaw(HomeIconFill) },
    },
    projects: {
        path: '/projects',
        name: 'Projects',
        component: () => import('@/views/ProjectsView.vue'),
        meta: { title: 'Projects', icon: markRaw(ProjectsIcon), iconFill: markRaw(ProjectsIcon) },
    },
    resume: {
        path: '/resume',
        name: 'Resume',
        component: markRaw(ResumeView),
        meta: { title: 'Resume', icon: markRaw(ResumeIcon), iconFill: markRaw(ResumeIconFill) },
    },
    contact: {
        path: '/contact',
        name: 'Contact',
        component: () => import('@/views/ContactView.vue'),
        meta: { title: 'Contact', icon: markRaw(ContactIcon), iconFill: markRaw(ContactIconFill) },
    },
};

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        ...Object.entries(navigationRoutes).map(([name, route]) => ({
            path: route.path,
            name,
            component: route.component,
            meta: route.meta,
        })),
        { path: '/home', redirect: { name: 'home' } },
        { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
    ],
});

function resolveLegacyHashRoute(hash) {
    const legacyPath = hash.replace(/^#\/?/, '');
    const [pathString, queryString] = legacyPath.split('?');
    const base = pathString.split('/').filter(Boolean)[0] || 'home';

    if (!navigationRoutes[base]) return null;

    const query = {};
    if (queryString) {
        new URLSearchParams(queryString).forEach((val, key) => {
            query[key] = val;
        });
    }

    return { name: base, query, replace: true };
}

router.beforeEach((to) => {
    if (to.path !== '/' || !to.hash) return true;

    return resolveLegacyHashRoute(to.hash) || true;
});

router.afterEach((to) => {
    let title = 'M. Green';

    if (to.meta?.title) {
        title += ' | ' + to.meta.title;
    }

    document.title = title;
});
