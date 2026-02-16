import { gsap } from 'gsap';
import { TIMING } from '@/animations/constants/timing.js';

export const homeAnimations = {
    enterPage: ({ tl }) => {
        gsap.set('.hero-content', { opacity: 0, x: -150 });
        gsap.set('.nav-link', { opacity: 0, x: 50 });
        gsap.set('.hero-line, .nav-links-line', { opacity: 0, scaleX: 0 });

        tl.to('.nav-link', {
            duration: TIMING.duration.normal,
            ease: TIMING.easing.organic,
            opacity: 1,
            x: 0,
            stagger: TIMING.stagger.normal,
        })
            .to(
                '.hero-content',
                {
                    duration: TIMING.duration.normal,
                    ease: TIMING.easing.organic,
                    opacity: 1,
                    x: 0,
                },
                0.2,
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
                '.hero-content',
                {
                    duration: TIMING.duration.normal,
                    ease: TIMING.easing.smooth,
                    opacity: 0,
                    x: -150,
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
            );
    },
};
