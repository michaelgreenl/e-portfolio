import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { TIMING } from '@/animations/constants/timing.js';

gsap.registerPlugin(Flip);

const getSelectedProjectDetailTargets = (target) => [
    ...target.querySelectorAll('.demo-video, .selected-description li'),
];

export const captureProjectToolChipState = (targets) => Flip.getState(targets);

export const cancelProjectToolChipAnimations = ({ timeline, targets, overflowTarget, maxWidths }) => {
    Flip.killFlipsOf(targets);
    timeline?.kill();
    gsap.killTweensOf([...targets, overflowTarget].filter(Boolean));

    targets.forEach((target, index) => {
        [
            'opacity',
            'visibility',
            'transform',
            'transform-origin',
            'translate',
            'rotate',
            'scale',
            'width',
            'height',
            'max-height',
            'min-width',
            'min-height',
        ].forEach((property) => target.style.removeProperty(property));

        target.style.maxWidth = maxWidths?.[index] ?? '';
    });

    ['opacity', 'visibility', 'transform', 'translate', 'rotate', 'scale'].forEach((property) =>
        overflowTarget?.style.removeProperty(property),
    );
};

export const projectAnimations = {
    hideToolOverflow: ({ tl, target, onComplete, reducedMotion }) => {
        gsap.killTweensOf(target);
        tl.eventCallback('onComplete', onComplete);
        tl.to(target, {
            autoAlpha: 0,
            duration: reducedMotion ? 0.01 : TIMING.duration.fast,
            ease: TIMING.easing.linear,
        });
    },

    revealToolRow: ({ tl, flipState, initialTargets, enteringTargets, overflowTarget, onComplete, reducedMotion }) => {
        const targets = [...initialTargets, ...enteringTargets, overflowTarget].filter(Boolean);

        gsap.killTweensOf(targets);
        gsap.set(overflowTarget, { clearProps: 'opacity,visibility' });
        gsap.set(enteringTargets, { autoAlpha: 0, xPercent: 50 });
        tl.eventCallback('onComplete', onComplete);
        tl.add(
            Flip.from(flipState, {
                clearProps: true,
                duration: reducedMotion ? 0.01 : TIMING.duration.normal,
                ease: TIMING.easing.smooth,
                scale: false,
            }),
        );

        if (enteringTargets.length) {
            tl.to(enteringTargets, {
                autoAlpha: 1,
                clearProps: 'opacity,visibility,transform',
                duration: reducedMotion ? 0.01 : TIMING.duration.fast,
                ease: TIMING.easing.smooth,
                stagger: reducedMotion ? 0 : TIMING.stagger.instant,
                xPercent: 0,
            });
        }
    },

    showSelectedProject: ({ tl, targets, reducedMotion }) => {
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

    hideSelectedProject: ({ tl, targets, onComplete, reducedMotion }) => {
        tl.to(targets, {
            autoAlpha: 0,
            duration: reducedMotion ? 0.01 : TIMING.duration.normal,
            ease: TIMING.easing.smooth,
            scale: reducedMotion ? 1 : 0.98,
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
