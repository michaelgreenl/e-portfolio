import { defineStore } from 'pinia';
import { ref, markRaw, computed, watch, defineAsyncComponent } from 'vue';
import { LEAVE_DURATION } from '@/animations/constants/timing';

import HomeIcon from '@/components/SVGs/HomeIcon.vue';
import HomeIconFill from '@/components/SVGs/HomeIconFill.vue';
import ProjectsIcon from '@/components/SVGs/ProjectsIcon.vue';
import ResumeIcon from '@/components/SVGs/ResumeIcon.vue';
import ResumeIconFill from '@/components/SVGs/ResumeIconFill.vue';
import ContactIcon from '@/components/SVGs/ContactIcon.vue';
import ContactIconFill from '@/components/SVGs/ContactIconFill.vue';

export const useRouteStore = defineStore('router', () => {
    const routes = {
        home: {
            component: defineAsyncComponent(() => import('@/views/HomeView.vue')),
            name: 'Home',
            meta: { title: 'Portfolio', icon: markRaw(HomeIcon), iconFill: markRaw(HomeIconFill) },
        },
        projects: {
            component: defineAsyncComponent(() => import('@/views/ProjectsView.vue')),
            name: 'Projects',
            meta: { title: 'Projects', icon: markRaw(ProjectsIcon), iconFill: markRaw(ProjectsIcon) },
        },
        resume: {
            component: defineAsyncComponent(() => import('@/views/ResumeView.vue')),
            name: 'Resume',
            meta: { title: 'Resume', icon: markRaw(ResumeIcon), iconFill: markRaw(ResumeIconFill) },
        },
        contact: {
            component: defineAsyncComponent(() => import('@/views/ContactView.vue')),
            name: 'Contact',
            meta: { title: 'Contact', icon: markRaw(ContactIcon), iconFill: markRaw(ContactIconFill) },
        },
    };

    const activePath = ref(getInitialPath());
    const isLeaving = ref(false);
    const toPath = ref();
    const leaveDuration = LEAVE_DURATION;

    function parsePath(fullPath) {
        const [pathString, queryString] = fullPath.split('?');
        const parts = pathString.split('/');
        const base = parts[0] || 'home';
        const params = { id: parts[1] || null };

        const query = {};
        if (queryString) {
            new URLSearchParams(queryString).forEach((val, key) => {
                query[key] = val;
            });
        }

        return { base, params, query };
    }

    function getInitialPath() {
        const hash = window.location.hash.slice(1);
        if (!hash) return 'home';

        const { base } = parsePath(hash);
        return routes[base] ? hash : 'home';
    }

    const currentRoute = computed(() => {
        const { base, params, query } = parsePath(activePath.value);

        return {
            base,
            params,
            query,
            component: routes[base]?.component,
            meta: routes[base]?.meta,
        };
    });

    async function changeRoute(to) {
        isLeaving.value = true;
        toPath.value = to;

        await new Promise((resolve) => setTimeout(resolve, leaveDuration));

        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

        activePath.value = to;
        isLeaving.value = false;
        window.location.hash = to;
    }

    function toRoute(to) {
        const { base } = parsePath(to);
        if (!routes[base]) {
            to = 'home';
        }

        changeRoute(to);
    }

    window.addEventListener('hashchange', async () => {
        const newPath = getInitialPath();
        if (newPath !== activePath.value) {
            changeRoute(newPath);
        }
    });

    watch(
        activePath,
        (newPath) => {
            const { base } = parsePath(newPath);

            let title = 'M. Green';
            if (routes[base]?.meta?.title) {
                title += ' | ' + routes[base].meta.title;
            }

            document.title = title;
        },
        { immediate: true },
    );

    if (!window.location.hash) {
        window.location.hash = activePath.value;
    }

    return { routes, activePath, currentRoute, toRoute, isLeaving, leaveDuration, toPath };
});
