import { gsap } from 'gsap';
import { useGsap } from '@/composables/useGsap.js';

export function useProjectsAnimations() {
    const { registerAnim } = useGsap();

    const pageEnter = registerAnim(({ tl }) => {
        gsap.set('.page-header h1, .page-header hr, .page-header p, .project-card', { opacity: 0 });
        gsap.set('.page-header hr', { scaleX: 0 });

        tl.to('.page-header h1, .page-header hr, .page-header p, .project-card', {
            duration: 0.3,
            ease: 'linear',
            opacity: 1,
            stagger: 0.1,
        }).to('.page-header hr', { duration: 0.4, ease: 'power4.out', scaleX: 1 }, 0.3);
    });

    const pageExit = registerAnim(({ tl }) => {
        tl.to('.page-header h1, .page-header hr, .page-header p, .project-card', {
            duration: 0.2,
            ease: 'linear',
            opacity: 0,
            stagger: 0.05,
        }).to('.page-header hr', { duration: 0.3, ease: 'power4.out', scaleX: 0 }, 0.2);
    });

    const showSelectedProject = registerAnim(({ tl }) => {
        gsap.set('.selected-container, .overlay', { opacity: 0 });

        tl.to('.selected-container, .overlay', { duration: 0.3, ease: 'power3.out', opacity: 1 });
    });

    const hideSelectedProject = registerAnim(({ tl, onComplete }) => {
        tl.to('.selected-container, .overlay', { duration: 0.3, ease: 'power3.out', opacity: 0, onComplete });
    });

    return {
        pageEnter,
        pageExit,
        showSelectedProject,
        hideSelectedProject,
    };
}
