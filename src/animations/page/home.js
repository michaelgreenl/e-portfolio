import { gsap } from 'gsap';
import { TIMING } from '@/animations/constants/timing.js';

export const homeAnimations = {
    enterPage: ({ tl }) => {
        gsap.set('.hero-content > h3, .hero-title, .hero-content > h2, .hero-content > p, .cta > button, .cta > a', {
            opacity: 0,
        });
        gsap.set('.nav-link', { opacity: 0, x: 50 });
        gsap.set('.hero-line, .nav-links-line', { opacity: 0, scaleX: 0 });
        gsap.set('.contact-link', { opacity: 0 });

        tl.to('.nav-link', {
            duration: TIMING.duration.normal,
            ease: TIMING.easing.organic,
            opacity: 1,
            x: 0,
            stagger: TIMING.stagger.normal,
        })
            .to(
                '.hero-content > h3, .hero-title-1, .hero-title-2, .hero-content > h2, .hero-content > p, .cta > button, .cta > a',
                {
                    duration: TIMING.duration.moderate,
                    ease: TIMING.easing.linear,
                    opacity: 1,
                    stagger: TIMING.stagger.tight,
                },
                0.1,
            )
            .to(
                '.hero-line, .nav-links-line',
                {
                    duration: TIMING.duration.slow,
                    ease: TIMING.easing.bounce,
                    opacity: 1,
                    scaleX: 1,
                },
                0.2,
            )
            .to(
                '.contact-link',
                {
                    duration: TIMING.duration.normal,
                    ease: TIMING.easing.linear,
                    opacity: 1,
                    stagger: TIMING.stagger.normal,
                },
                0.2,
            );
    },

    exitPage: ({ tl }) => {
        tl.to('.hero-line, .nav-links-line', {
            duration: TIMING.duration.slow,
            ease: TIMING.easing.bounce,
            opacity: 0,
            scaleX: 0,
        })
            .to(
                '.cta > a, .cta > button, .hero-content > p, .hero-content > h2, .hero-title-2, .hero-title-1, .hero-content > h3',
                {
                    duration: TIMING.duration.normal,
                    ease: TIMING.easing.smooth,
                    stagger: TIMING.stagger.tight,
                    opacity: 0,
                },
                0,
            )
            .to(
                '.nav-link',
                {
                    duration: TIMING.duration.normal,
                    ease: TIMING.easing.smooth,
                    opacity: 0,
                    x: 50,
                    stagger: TIMING.stagger.tight,
                },
                0,
            )
            .to(
                '.contact-link',
                {
                    duration: TIMING.duration.normal,
                    ease: TIMING.easing.linear,
                    opacity: 0,
                    stagger: TIMING.stagger.tight,
                },
                0,
            );
    },
};
