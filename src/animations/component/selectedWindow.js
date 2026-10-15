import { gsap } from 'gsap';
import { TIMING } from '@/animations/constants/timing.js';

export const selectedWindowAnimations = {
    show: ({ tl, targets, reducedMotion }) => {
        gsap.set(targets, {
            autoAlpha: 0,
            scale: reducedMotion ? 1 : 0.98,
        });

        tl.to(targets, {
            autoAlpha: 1,
            duration: reducedMotion ? 0.01 : TIMING.duration.normal,
            ease: TIMING.easing.smooth,
            scale: 1,
        });
    },

    hide: ({ tl, targets, onComplete, reducedMotion }) => {
        tl.to(targets, {
            autoAlpha: 0,
            duration: reducedMotion ? 0.01 : TIMING.duration.normal,
            ease: TIMING.easing.smooth,
            scale: reducedMotion ? 1 : 0.98,
            onComplete,
        });
    },
};
