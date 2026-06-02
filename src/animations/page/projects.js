import { gsap } from 'gsap';
import { TIMING } from '@/animations/constants/timing.js';

export const projectAnimations = {
    showSelectedProject: ({ tl, targets }) => {
        gsap.set(targets, { opacity: 0 });

        tl.to(targets, {
            duration: TIMING.duration.normal,
            ease: TIMING.easing.smooth,
            opacity: 1,
        });
    },

    hideSelectedProject: ({ tl, targets, onComplete }) => {
        tl.to(targets, {
            duration: TIMING.duration.normal,
            ease: TIMING.easing.smooth,
            opacity: 0,
            onComplete,
        });
    },

    expandProjectCard: ({ tl, targets }) => {
        tl.to(targets, {
            duration: TIMING.duration.normal,
            ease: TIMING.easing.smooth,
            height: 'auto',
        });
    },

    shrinkProjectCard: ({ tl, targets }) => {
        tl.to(targets, {
            duration: TIMING.duration.normal,
            ease: TIMING.easing.smooth,
            height: 'auto',
        });
    },
};
