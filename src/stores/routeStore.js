import { defineStore } from 'pinia';
import { ref, markRaw } from 'vue';
import HomeView from '../views/HomeView.vue';
import ProjectsView from '../views/ProjectsView.vue';
import ExperienceView from '../views/ExperienceView.vue';
import ContactView from '../views/ContactView.vue';

export const useRouteStore = defineStore('router', () => {
    const routes = {
        home: {
            component: markRaw(HomeView),
            meta: { title: 'Home' },
        },
        projects: {
            component: markRaw(ProjectsView),
            meta: { title: 'Projects' },
        },
        experience: {
            component: markRaw(ExperienceView),
            meta: { title: 'Experience' },
        },
        contact: {
            component: markRaw(ContactView),
            meta: { title: 'Contact' },
        },
    };

    const getInitialRoute = () => {
        const hash = window.location.hash.slice(1); // Remove #
        return routes[hash] ? hash : 'home';
    };

    const activeRoute = ref(getInitialRoute());
    const DEFAULT_TITLE = 'M. Green';

    function toRoute(to) {
        activeRoute.value = to;
        window.location.hash = to;

        let title = DEFAULT_TITLE;
        title += ' | ' + routes[to].meta.title;
        document.title = title;
    }

    // Listen for browser back/forward buttons
    window.addEventListener('hashchange', () => {
        const newRoute = getInitialRoute();
        if (newRoute !== activeRoute.value) {
            activeRoute.value = newRoute;
            let title = DEFAULT_TITLE;
            title += ' | ' + routes[newRoute].meta.title;
            document.title = title;
        }
    });

    if (!window.location.hash) {
        window.location.hash = activeRoute.value;
    }

    return { routes, activeRoute, toRoute };
});
