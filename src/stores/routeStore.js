import { defineStore } from 'pinia';
import { ref, reactive, markRaw, computed, watch } from 'vue';
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

const asyncView = async (base) => {
    const mod = await routeLoaders[base]();
    return markRaw(mod.default);
};

const routeAssets = {
    home: { fonts: ['400 1em "Inter"', '600 1em "ClashDisplay"'] },
    projects: {
        fonts: [
            '400 1em "Inter"',
            '600 1em "ClashDisplay"',
            '400 1em "BitCount"',
            '400 1em "AudioWide"',
            '400 1em "Futura"',
        ],
        images: [
            'algo-visualizer_blurred.webp',
            'game-lobby_blurred.webp',
            'reaction_blurred.webp',
            'tally_blurred.webp',
        ],
    },
    resume: {
        fonts: [
            '400 1em "Inter"',
            '600 1em "ClashDisplay"',
            '400 1em "Spartan"',
            '500 1em "Spartan"',
            '600 1em "Spartan"',
        ],
    },
    contact: { fonts: ['400 1em "Inter"', '500 1em "ClashDisplay"', '600 1em "ClashDisplay"'] },
};

const NEXT_ROUTE_ORDER = {
    home: ['projects', 'contact', 'resume'],
    projects: ['home', 'resume', 'contact'],
    resume: ['home', 'projects', 'contact'],
    contact: ['home', 'projects', 'resume'],
};

export const useRouteStore = defineStore('router', () => {
    const routes = reactive({
        home: {
            component: null,
            name: 'Home',
            meta: { title: 'Portfolio', icon: markRaw(HomeIcon), iconFill: markRaw(HomeIconFill) },
        },
        projects: {
            component: null,
            name: 'Projects',
            meta: { title: 'Projects', icon: markRaw(ProjectsIcon), iconFill: markRaw(ProjectsIcon) },
        },
        resume: {
            component: null,
            name: 'Resume',
            meta: { title: 'Resume', icon: markRaw(ResumeIcon), iconFill: markRaw(ResumeIconFill) },
        },
        contact: {
            component: null,
            name: 'Contact',
            meta: { title: 'Contact', icon: markRaw(ContactIcon), iconFill: markRaw(ContactIconFill) },
        },
    });

    const activePath = ref(getInitialPath());
    const isLeaving = ref(false);
    const toPath = ref();
    const isLoading = ref(false);
    const readyRoutes = ref(new Set());
    const routeReady = ref(false);
    const loadError = ref(null);
    const pendingAssets = new Map();
    const preloadedImages = new Map();
    let navId = 0;

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

    function loadRouteAssets(routeName) {
        if (readyRoutes.value.has(routeName)) return Promise.resolve();
        if (pendingAssets.has(routeName)) return pendingAssets.get(routeName);

        const outerPromise = (async () => {
            try {
                const results = await Promise.all([
                    asyncView(routeName),
                    ...(routeAssets[routeName]?.fonts ?? []).map((descriptor) => document.fonts.load(descriptor)),
                    ...(routeAssets[routeName]?.images ?? []).map((filename) => {
                        if (preloadedImages.has(filename)) return Promise.resolve();
                        const url = new URL(`../assets/images/${filename}`, import.meta.url).href;
                        return new Promise((resolve) => {
                            const img = new Image();
                            preloadedImages.set(filename, img);
                            img.onload = resolve;
                            img.onerror = resolve;
                            img.src = url;
                        });
                    }),
                ]);

                const component = results[0];
                routes[routeName].component = component;
                readyRoutes.value.add(routeName);
            } catch (err) {
                console.error(`Failed to load route assets for "${routeName}":`, err);
                throw err;
            } finally {
                pendingAssets.delete(routeName);
            }
        })();

        pendingAssets.set(routeName, outerPromise);
        return outerPromise;
    }

    async function preloadNextRoutes(currentRouteName) {
        const order = NEXT_ROUTE_ORDER[currentRouteName];
        if (!order) return;

        const remaining = order.filter((r) => !readyRoutes.value.has(r));

        function waitForIdle() {
            return new Promise((resolve) => {
                if (typeof requestIdleCallback === 'function') {
                    requestIdleCallback(resolve);
                } else {
                    setTimeout(resolve, 1);
                }
            });
        }

        for (const routeName of remaining) {
            await waitForIdle();
            await loadRouteAssets(routeName).catch(() => {});
        }
    }

    async function changeRoute(to) {
        const currentNavId = ++navId;
        const isStale = () => currentNavId !== navId;

        isLeaving.value = true;
        toPath.value = to;
        routeReady.value = false;

        const { base } = parsePath(to);

        const loadPromise = loadRouteAssets(base);
        let assetsResolved = false;
        loadPromise
            .then(() => {
                assetsResolved = true;
            })
            .catch(() => {});

        await new Promise((res) => setTimeout(res, leaveDuration));

        if (isStale()) return;

        let spinnerTimer;
        if (!assetsResolved) {
            spinnerTimer = setTimeout(() => {
                if (!isStale()) {
                    isLoading.value = true;
                }
            }, 100);
        }

        try {
            await loadPromise;
        } catch (err) {
            if (!isStale()) {
                loadError.value = 'Failed to load. Please refresh or try again.';
                clearTimeout(spinnerTimer);
                isLoading.value = false;
            }
            return;
        }

        if (isStale()) return;

        clearTimeout(spinnerTimer);
        isLoading.value = false;

        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        activePath.value = to;
        isLeaving.value = false;
        routeReady.value = true;
        window.location.hash = to;

        preloadNextRoutes(base);
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

    async function performInitialLoad() {
        const { base } = parsePath(activePath.value);
        const initialTimer = setTimeout(() => {
            isLoading.value = true;
        }, 100);

        try {
            await loadRouteAssets(base);
            clearTimeout(initialTimer);
            isLoading.value = false;
            if (readyRoutes.value.has(base)) {
                routeReady.value = true;
            }
            preloadNextRoutes(base);
        } catch (err) {
            clearTimeout(initialTimer);
            isLoading.value = false;
            loadError.value = 'Failed to load. Please refresh or try again.';
        }
    }

    function retryInitialLoad() {
        loadError.value = null;
        performInitialLoad();
    }

    performInitialLoad();

    return {
        routes,
        activePath,
        currentRoute,
        toRoute,
        isLeaving,
        toPath,
        isLoading,
        routeReady,
        loadError,
        retryInitialLoad,
    };
});
