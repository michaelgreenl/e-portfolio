import { defineStore } from 'pinia';
import { ref, markRaw, computed } from 'vue';
import HomeView from '@/views/HomeView.vue';
import ProjectsView from '@/views/ProjectsView.vue';
import ResumeView from '@/views/ResumeView.vue';
import ContactView from '@/views/ContactView.vue';
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
            component: markRaw(HomeView),
            meta: { title: 'Home', icon: markRaw(HomeIcon), iconFill: markRaw(HomeIconFill) },
        },
        projects: {
            component: markRaw(ProjectsView),
            meta: { title: 'Projects', icon: markRaw(ProjectsIcon), iconFill: markRaw(ProjectsIcon) },
        },
        resume: {
            component: markRaw(ResumeView),
            meta: { title: 'Resume', icon: markRaw(ResumeIcon), iconFill: markRaw(ResumeIconFill) },
        },
        contact: {
            component: markRaw(ContactView),
            meta: { title: 'Contact', icon: markRaw(ContactIcon), iconFill: markRaw(ContactIconFill) },
        },
    };

    const DEFAULT_TITLE = 'M.G.';

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

    const activePath = ref(getInitialPath());
    const isLeaving = ref(false);
    const toPath = ref();
    const leaveDuration = 350;

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

    async function toRoute(to) {
        const { base } = parsePath(to);
        if (!routes[base]) {
            to = 'home';
        }

        isLeaving.value = true;
        toPath.value = to;

        await new Promise((resolve) => setTimeout(resolve, leaveDuration));

        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

        activePath.value = to;
        isLeaving.value = false;
        window.location.hash = to;

        let title = DEFAULT_TITLE;
        if (routes[base]?.meta?.title) {
            title += ' | ' + routes[base].meta.title;
        }
        document.title = title;
    }

    window.addEventListener('hashchange', () => {
        const newPath = getInitialPath();
        if (newPath !== activePath.value) {
            activePath.value = newPath;
            const { base } = parsePath(newPath);
            let title = DEFAULT_TITLE;
            if (routes[base]?.meta?.title) {
                title += ' | ' + routes[base].meta.title;
            }
            document.title = title;
        }
    });

    if (!window.location.hash) {
        window.location.hash = activePath.value;
    }

    return { routes, activePath, currentRoute, toRoute, isLeaving, leaveDuration, toPath };
});
