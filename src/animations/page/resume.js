import { gsap } from 'gsap';
import { TIMING } from '@/animations/constants/timing.js';

export const resumeAnimations = {
    enterPage: ({ tl, reducedMotion }) => {
        const duration = reducedMotion ? 0.01 : TIMING.duration.moderate;
        const stagger = reducedMotion ? 0 : TIMING.stagger.tight;

        gsap.set('.page-title > span', { autoAlpha: 0, x: reducedMotion ? 0 : -16 });
        gsap.set('.page-title > h1', { autoAlpha: 0, y: reducedMotion ? 0 : 20 });
        gsap.set('.download-link', { autoAlpha: 0, scale: reducedMotion ? 1 : 0.94, x: reducedMotion ? 0 : 20 });
        gsap.set('.section-header', { autoAlpha: 0, x: reducedMotion ? 0 : -18 });
        gsap.set('.section-content', { autoAlpha: 0, scale: reducedMotion ? 1 : 0.99, y: reducedMotion ? 0 : 18 });

        tl.addLabel('resume')
            .to('.page-title > span, .page-title > h1, .download-link', {
                autoAlpha: 1,
                duration,
                ease: TIMING.easing.smooth,
                scale: 1,
                stagger,
                x: 0,
                y: 0,
            })
            .to(
                '.section-header',
                {
                    autoAlpha: 1,
                    duration,
                    ease: TIMING.easing.smooth,
                    stagger,
                    x: 0,
                },
                reducedMotion ? 0 : 'resume+=0.14',
            )
            .to(
                '.section-content',
                {
                    autoAlpha: 1,
                    duration,
                    ease: TIMING.easing.smooth,
                    scale: 1,
                    stagger,
                    y: 0,
                },
                reducedMotion ? 0 : 'resume+=0.2',
            );
    },
    exitPage: ({ tl, reducedMotion }) => {
        tl.to('.section-content, .section-header, .download-link, .page-title > span, .page-title > h1', {
            autoAlpha: 0,
            duration: reducedMotion ? 0.01 : TIMING.duration.fast,
            ease: TIMING.easing.smooth,
            scale: reducedMotion ? 1 : 0.98,
            stagger: reducedMotion ? 0 : TIMING.stagger.instant,
            y: reducedMotion ? 0 : -10,
        });
    },
};
