import { createRouter, createWebHistory } from 'vue-router';
import projectsData from '@/assets/data/projects.json';

const SITE_ORIGIN = 'https://michaelgreenl.net';
const SITE_NAME = 'Michael Green | Full-Stack Developer';
const DEFAULT_DESCRIPTION =
    'Michael Green is a full-stack developer building secure, scalable applications with polished interfaces and maintainable backend architecture.';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/web-app-manifest-512x512.png`;

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: {
            navKey: 'home',
            title: 'Portfolio',
            description: DEFAULT_DESCRIPTION,
        },
    },
    {
        path: '/projects',
        name: 'projects',
        component: () => import('@/views/ProjectsView.vue'),
        meta: {
            navKey: 'projects',
            title: 'Projects',
            description:
                'Selected full-stack, cross-platform, real-time, visualization, and agentic application projects by Michael Green.',
        },
    },
    {
        path: '/projects/:slug',
        name: 'project',
        component: () => import('@/views/ProjectsView.vue'),
        meta: {
            navKey: 'projects',
            title: 'Projects',
            description:
                'Selected full-stack, cross-platform, real-time, visualization, and agentic application projects by Michael Green.',
        },
    },
    {
        path: '/resume',
        name: 'resume',
        component: () => import('@/views/ResumeView.vue'),
        meta: {
            navKey: 'resume',
            title: 'Resume',
            description: 'Resume for Michael Green, including experience, projects, education, and technical skills.',
        },
    },
    {
        path: '/contact',
        name: 'contact',
        component: () => import('@/views/ContactView.vue'),
        meta: {
            navKey: 'contact',
            title: 'Contact',
            description: 'Contact Michael Green by email, GitHub, LinkedIn, or the portfolio contact form.',
        },
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(_to, _from, savedPosition) {
        return savedPosition || { top: 0, left: 0 };
    },
});

function findProject(route) {
    return route.name === 'project' ? projectsData.find((project) => project.slug === route.params.slug) : null;
}

function setMetaTag(attribute, key, content) {
    let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);

    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, key);
        document.head.appendChild(tag);
    }

    tag.setAttribute('content', content);
}

function updateDocumentMeta(route) {
    const project = findProject(route);
    const title = project ? `${project.title} | M. Green Projects` : `M. Green | ${route.meta.title}`;
    const description = project?.description?.short || route.meta.description || DEFAULT_DESCRIPTION;
    const canonicalUrl = `${SITE_ORIGIN}${route.path}`;

    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', DEFAULT_IMAGE);
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', DEFAULT_IMAGE);
}

router.afterEach((to) => {
    updateDocumentMeta(to);
});

export default router;
