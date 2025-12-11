import { gsap } from 'gsap';
import { useGsap } from '@/composables/useGsap.js';

export function useHomeAnimations() {
    const { registerAnim } = useGsap();

    const enterPageAnim = registerAnim(({ tl }) => {
        gsap.set('.hero-content', { opacity: 0, x: -150 });
        gsap.set('.nav-link', { opacity: 0, x: 50 });
        gsap.set('.hero-line, .nav-links-line', { opacity: 0, scaleX: 0 });

        tl.to('.nav-link', { duration: 0.3, ease: 'circ', opacity: 1, x: 0, stagger: 0.1 })
            .to('.hero-content', { duration: 0.3, ease: 'circ', opacity: 1, x: 0 }, 0.2)
            .to('.hero-line, .nav-links-line', { duration: 0.5, ease: 'power4.out', opacity: 1, scaleX: 1 }, 0.2);
    });

    const exitPageAnim = registerAnim(({ tl }) => {
        tl.to('.hero-line, .nav-links-line', { duration: 0.5, ease: 'power4.out', opacity: 0, scaleX: 0 })
            .to('.hero-content', { duration: 0.3, ease: 'power3.out', opacity: 0, x: -150 }, 0)
            .to('.nav-link', { duration: 0.3, ease: 'power3.out', opacity: 0, x: 50, stagger: 0.05 }, 0);
    });

    return {
        enterPageAnim,
        exitPageAnim,
    };
}
