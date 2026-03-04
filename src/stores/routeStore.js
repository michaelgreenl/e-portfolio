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

const routeLoaders = {
    home: () => import('@/views/HomeView.vue'),
    projects: () => import('@/views/ProjectsView.vue'),
    resume: () => import('@/views/ResumeView.vue'),
    contact: () => import('@/views/ContactView.vue'),
};

const asyncView = (base) =>
    markRaw(
        defineAsyncComponent({
            loader: () => loadRouteModule(base),
            loadingComponent: RouteLoading,
        }),
    );

const routeFontDescriptors = {
    home: ['400 1em "Inter"', '600 1em "ClashDisplay"'],
    projects: [
        '400 1em "Inter"',
        '600 1em "ClashDisplay"',
        '400 1em "BitCount"',
        '400 1em "AudioWide"',
        '400 1em "Futura"',
    ],
    resume: [
        '400 1em "Inter"',
        '600 1em "ClashDisplay"',
        '400 1em "Spartan"',
        '500 1em "Spartan"',
        '600 1em "Spartan"',
    ],
    contact: ['400 1em "Inter"', '500 1em "ClashDisplay"', '600 1em "ClashDisplay"'],
};

const NEXT_ROUTE_ORDER = {
    home: ['projects', 'contact', 'resume'],
    projects: ['home', 'resume', 'contact'],
    resume: ['home', 'projects', 'contact'],
    contact: ['home', 'projects', 'resume'],
};

export const useRouteStore = defineStore('router', () => {
    const routes = {
        home: {
            component: asyncView('home'),
            name: 'Home',
            meta: { title: 'Portfolio', icon: markRaw(HomeIcon), iconFill: markRaw(HomeIconFill) },
        },
        projects: {
            component: asyncView('projects'),
            name: 'Projects',
            meta: { title: 'Projects', icon: markRaw(ProjectsIcon), iconFill: markRaw(ProjectsIcon) },
        },
        resume: {
            component: asyncView('resume'),
            name: 'Resume',
            meta: { title: 'Resume', icon: markRaw(ResumeIcon), iconFill: markRaw(ResumeIconFill) },
        },
        contact: {
            component: asyncView('contact'),
            name: 'Contact',
            meta: { title: 'Contact', icon: markRaw(ContactIcon), iconFill: markRaw(ContactIconFill) },
        },
    };

    const activePath = ref(getInitialPath());
    const isLeaving = ref(false);
    const toPath = ref();

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

    const leaveDuration = LEAVE_DURATION;

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

    return { routes, activePath, currentRoute, toRoute, isLeaving, toPath };
});
