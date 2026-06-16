import { defineStore } from 'pinia';
import { markRaw, computed, shallowRef } from 'vue';
import { LEAVE_DURATION } from '@/animations/constants/timing';
import router from '@/router';

import HomeIcon from '@/components/SVGs/Views/HomeIcon.vue';
import HomeIconFill from '@/components/SVGs/Views/HomeIconFill.vue';
import ProjectsIcon from '@/components/SVGs/Views/ProjectsIcon.vue';
import ResumeIcon from '@/components/SVGs/Views/ResumeIcon.vue';
import ResumeIconFill from '@/components/SVGs/Views/ResumeIconFill.vue';
import ContactIcon from '@/components/SVGs/Views/ContactIcon.vue';
import ContactIconFill from '@/components/SVGs/Views/ContactIconFill.vue';

export const useRouteStore = defineStore('router', () => {
    const routes = {
        home: {
            name: 'Home',
            path: '/',
            meta: { title: 'Portfolio', icon: markRaw(HomeIcon), iconFill: markRaw(HomeIconFill) },
        },
        projects: {
            name: 'Projects',
            path: '/projects',
            meta: { title: 'Projects', icon: markRaw(ProjectsIcon), iconFill: markRaw(ProjectsIcon) },
        },
        resume: {
            name: 'Resume',
            path: '/resume',
            meta: { title: 'Resume', icon: markRaw(ResumeIcon), iconFill: markRaw(ResumeIconFill) },
        },
        contact: {
            name: 'Contact',
            path: '/contact',
            meta: { title: 'Contact', icon: markRaw(ContactIcon), iconFill: markRaw(ContactIconFill) },
        },
    };

    const isLeaving = shallowRef(false);
    const toPath = shallowRef();
    const leaveDuration = LEAVE_DURATION;

    const activePath = computed(() => router.currentRoute.value.meta.navKey || 'home');
    const currentRoute = computed(() => {
        const route = router.currentRoute.value;
        const base = route.meta.navKey || 'home';

        return {
            base,
            params: route.params,
            query: route.query,
            meta: routes[base]?.meta,
        };
    });

    function getHref(to) {
        return routes[to]?.path || to || '/';
    }

    function getRouteKey(href) {
        return Object.entries(routes).find(([, route]) => route.path === href)?.[0] || 'home';
    }

    async function changeRoute(to) {
        const href = getHref(to);

        if (href === router.currentRoute.value.path) return;

        isLeaving.value = true;
        toPath.value = getRouteKey(href);

        await new Promise((resolve) => setTimeout(resolve, leaveDuration));

        await router.push(href);
        isLeaving.value = false;
    }

    function toRoute(to) {
        changeRoute(getHref(to));
    }

    return { routes, activePath, currentRoute, toRoute, getHref, isLeaving, leaveDuration, toPath };
});
