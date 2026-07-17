import { gsap } from 'gsap';
import { TIMING } from '@/animations/constants/timing.js';

const getSelectedProjectDetailTargets = (target) => [
    ...target.querySelectorAll('.demo-video, .selected-description li'),
];

export const projectAnimations = {
    showSelectedProject: ({ tl, targets, reducedMotion }) => {
        gsap.set(targets, {
            autoAlpha: 0,
            scale: reducedMotion ? 1 : 0.98,
            y: reducedMotion ? 0 : 16,
        });

        tl.to(targets, {
            autoAlpha: 1,
            duration: reducedMotion ? 0.01 : TIMING.duration.normal,
            ease: TIMING.easing.smooth,
            scale: 1,
            y: 0,
        });
    },

    hideSelectedProject: ({ tl, targets, onComplete, reducedMotion }) => {
        tl.to(targets, {
            autoAlpha: 0,
            duration: reducedMotion ? 0.01 : TIMING.duration.normal,
            ease: TIMING.easing.smooth,
            scale: reducedMotion ? 1 : 0.98,
            y: reducedMotion ? 0 : 12,
            onComplete,
        });
    },

    showSelectedProjectDetails: ({ tl, target, onComplete }) => {
        const detailTargets = getSelectedProjectDetailTargets(target);

        gsap.killTweensOf([target, ...detailTargets]);
        gsap.set(target, { height: 0, overflow: 'hidden' });
        gsap.set(detailTargets, { autoAlpha: 0, y: 8 });

        tl.eventCallback('onComplete', () => {
            gsap.set(target, { clearProps: 'height,overflow' });
            onComplete();
        });

        tl.to(target, {
            duration: TIMING.duration.moderate,
            ease: TIMING.easing.smooth,
            height: 'auto',
        });

        if (detailTargets.length) {
            tl.to(
                detailTargets,
                {
                    duration: TIMING.duration.fast,
                    ease: TIMING.easing.smooth,
                    autoAlpha: 1,
                    y: 0,
                    stagger: TIMING.stagger.tight,
                },
                '-=0.2',
            );
        }
    },

    hideSelectedProjectDetails: ({ tl, target, onComplete }) => {
        const detailTargets = getSelectedProjectDetailTargets(target);

        gsap.killTweensOf([target, ...detailTargets]);
        gsap.set(target, { height: target.offsetHeight, overflow: 'hidden' });
        tl.eventCallback('onComplete', onComplete);

        if (detailTargets.length) {
            tl.to(detailTargets, {
                duration: TIMING.duration.fast,
                ease: TIMING.easing.linear,
                autoAlpha: 0,
                y: -6,
                stagger: {
                    each: TIMING.stagger.instant,
                    from: 'end',
                },
            });
        }

        tl.to(
            target,
            {
                duration: TIMING.duration.normal,
                ease: TIMING.easing.bounceIn,
                height: 0,
            },
            detailTargets.length ? '<' : 0,
        );
    },
};
