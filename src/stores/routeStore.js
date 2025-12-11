import { defineStore } from 'pinia';
import { ref, markRaw, computed } from 'vue';
import HomeView from '@/views/HomeView.vue';
import ProjectsView from '@/views/ProjectsView.vue';
import ExperienceView from '@/views/ExperienceView.vue';
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
        experience: {
            component: markRaw(ExperienceView),
            meta: { title: 'Resume', icon: markRaw(ResumeIcon), iconFill: markRaw(ResumeIconFill) },
        },
        contact: {
            component: markRaw(ContactView),
            meta: { title: 'Contact', icon: markRaw(ContactIcon), iconFill: markRaw(ContactIconFill) },
        },
    };

    const DEFAULT_TITLE = 'M.G.';

    // Helper to parse a path string into base and params
    function parsePath(path) {
        const parts = path.split('/');
        const base = parts[0] || 'home';
        const params = { id: parts[1] || null }; // Assumes one param (id) for simplicity
        return { base, params };
    }

    // Get initial path from hash, default to 'home'
    function getInitialPath() {
        const hash = window.location.hash.slice(1);
        if (!hash) return 'home';
        const { base } = parsePath(hash);
        return routes[base] ? hash : 'home'; // Redirect invalid base to home
    }

    const activePath = ref(getInitialPath());
    const isLeaving = ref(false);
    const toPath = ref();
    const leaveDuration = 350;

    // Computed current route details
    const currentRoute = computed(() => {
        const { base, params } = parsePath(activePath.value);
        return {
            base,
            params,
            component: routes[base]?.component,
            meta: routes[base]?.meta,
        };
    });

    async function toRoute(to) {
        const { base } = parsePath(to);
        if (!routes[base]) {
            to = 'home';
        }

        // Trigger leave animations in current view
        isLeaving.value = true;
        toPath.value = to;

        // Wait for leave animation to complete
        await new Promise((resolve) => setTimeout(resolve, leaveDuration));

        // Reset flag and proceed with route change
        activePath.value = to;
        isLeaving.value = false;
        window.location.hash = to;

        let title = DEFAULT_TITLE;
        if (routes[base]?.meta?.title) {
            title += ' | ' + routes[base].meta.title;
        }
        document.title = title;
    }

    // Listen for browser back/forward buttons
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

    // Set initial hash if missing
    if (!window.location.hash) {
        window.location.hash = activePath.value;
    }

    return { routes, activePath, currentRoute, toRoute, isLeaving, leaveDuration, toPath };
});
