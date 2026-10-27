import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { LEAVE_DURATION } from '@/animations/constants/timing';
import { navigationRoutes, router } from '@/router/index.js';

export const useRouteStore = defineStore('router', () => {
    const routes = navigationRoutes;
    const isLeaving = ref(false);
    const toPath = ref();
    const leaveDuration = LEAVE_DURATION;

    function getRouteBase(route) {
        const name = route.name?.toString();

        return routes[name] ? name : 'home';
    }

    function toActivePath(route) {
        const base = getRouteBase(route);

        if (base === 'home') return 'home';

        return route.fullPath.replace(/^\//, '');
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

    function toRoute(name) {
        return router.push({ name: routes[name] ? name : 'home' });
    }

    router.beforeEach(async (to, from) => {
        if (!from.name || to.fullPath === from.fullPath) return true;

        isLeaving.value = true;
        toPath.value = getRouteBase(to);

        await new Promise((resolve) => setTimeout(resolve, leaveDuration));

        window.scrollTo({ top: 0, left: 0 });

        return true;
    });

    router.afterEach(() => {
        isLeaving.value = false;
    });

    return { routes, activePath, currentRoute, toRoute, isLeaving, leaveDuration, toPath };
});
