import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { LEAVE_DURATION } from '@/animations/constants/timing';
import { navigationRoutes, router } from '@/router/index.js';

export const useRouteStore = defineStore('router', () => {
    const routes = navigationRoutes;
    const isLeaving = ref(false);
    const toPath = ref();
    const leaveDuration = LEAVE_DURATION;

    function parsePath(fullPath) {
        const [pathString, queryString] = fullPath.split('?');
        const parts = pathString.split('/').filter(Boolean);
        const base = parts[0] || 'home';

        const query = {};
        if (queryString) {
            new URLSearchParams(queryString).forEach((val, key) => {
                query[key] = val;
            });
        }

        return { base, query };
    }

    function getRouteBase(route) {
        const name = route.name?.toString();

        return routes[name] ? name : 'home';
    }

    function toActivePath(route) {
        const base = getRouteBase(route);

        if (base === 'home') return 'home';

        return route.fullPath.replace(/^\//, '');
    }

    function resolveRoute(to) {
        if (typeof to !== 'string') return to;

        const { base, query } = parsePath(to);
        if (!routes[base]) return { name: 'home' };

        return { name: base, query };
    }

    const activePath = computed(() => toActivePath(router.currentRoute.value));

    const currentRoute = computed(() => {
        const route = router.currentRoute.value;
        const base = getRouteBase(route);

        return {
            base,
            params: route.params,
            query: route.query,
            component: route.matched[0]?.components?.default,
            meta: route.meta,
        };
    });

    function toRoute(to) {
        return router.push(resolveRoute(to));
    }

    router.beforeEach(async (to, from) => {
        if (!from.name || to.fullPath === from.fullPath) return true;

        isLeaving.value = true;
        toPath.value = getRouteBase(to);

        await new Promise((resolve) => setTimeout(resolve, leaveDuration));

        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

        return true;
    });

    router.afterEach(() => {
        isLeaving.value = false;
    });

    return { routes, activePath, currentRoute, toRoute, isLeaving, leaveDuration, toPath };
});
