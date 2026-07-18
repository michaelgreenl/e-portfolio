import { gsap } from 'gsap';
import { TIMING } from '@/animations/constants/timing.js';

export const homeAnimations = {
    enterPage: ({ tl, reducedMotion }) => {
        const duration = reducedMotion ? 0.01 : TIMING.duration.moderate;
        const stagger = reducedMotion ? 0 : TIMING.stagger.tight;

        gsap.set('.hero-content > h3', { autoAlpha: 0, y: reducedMotion ? 0 : -16 });
        gsap.set('.hero-title-1', { autoAlpha: 0, scale: reducedMotion ? 1 : 0.96, x: reducedMotion ? 0 : -48 });
        gsap.set('.hero-title-2', { autoAlpha: 0, scale: reducedMotion ? 1 : 0.96, x: reducedMotion ? 0 : 48 });
        gsap.set('.hero-content > h2, .hero-content > p', { autoAlpha: 0, y: reducedMotion ? 0 : 20 });
        gsap.set('.cta > button, .cta > a', {
            autoAlpha: 0,
            scale: reducedMotion ? 1 : 0.94,
            y: reducedMotion ? 0 : 18,
        });
        gsap.set('.nav-link', {
            opacity: 0,
            x: reducedMotion ? 0 : 50,
        });
        gsap.set('.hero-line, .nav-links-line', {
            autoAlpha: 0,
            scaleX: 0,
        });
        gsap.set('.contact-link', {
            autoAlpha: 0,
            scale: reducedMotion ? 1 : 0.8,
            y: reducedMotion ? 0 : -12,
        });

        tl.addLabel('hero')
            .to('.hero-content > h3', {
                autoAlpha: 1,
                duration,
                ease: TIMING.easing.smooth,
                y: 0,
            })
            .to(
                '.hero-title',
                {
                    autoAlpha: 1,
                    duration: reducedMotion ? 0.01 : TIMING.duration.slow,
                    ease: TIMING.easing.smooth,
                    scale: 1,
                    stagger: TIMING.stagger.loose,
                    x: 0,
                },
                reducedMotion ? 0 : 'hero+=0.06',
            )
            .to(
                '.hero-content > h2, .hero-content > p',
                {
                    autoAlpha: 1,
                    duration,
                    ease: TIMING.easing.smooth,
                    stagger,
                    y: 0,
                },
                reducedMotion ? 0 : 'hero+=0.18',
            )
            .to(
                '.cta > button, .cta > a',
                {
                    autoAlpha: 1,
                    duration,
                    ease: TIMING.easing.smooth,
                    scale: 1,
                    stagger,
                    y: 0,
                },
                reducedMotion ? 0 : 'hero+=0.26',
            )
            .to(
                '.hero-line, .nav-links-line',
                {
                    autoAlpha: 1,
                    duration: reducedMotion ? 0.01 : TIMING.duration.slow,
                    ease: TIMING.easing.bounce,
                    scaleX: 1,
                },
                reducedMotion ? 0 : 'hero+=0.12',
            )
            .to(
                '.nav-link',
                {
                    duration: reducedMotion ? 0.01 : TIMING.duration.normal,
                    ease: TIMING.easing.organic,
                    opacity: 1,
                    stagger: reducedMotion ? 0 : TIMING.stagger.normal,
                    x: 0,
                },
                0,
            )
            .to(
                '.contact-link',
                {
                    autoAlpha: 1,
                    duration,
                    ease: TIMING.easing.smooth,
                    scale: 1,
                    stagger: reducedMotion ? 0 : TIMING.stagger.normal,
                    y: 0,
                },
                reducedMotion ? 0 : 'hero+=0.18',
            );
    },

    exitPage: ({ tl, reducedMotion }) => {
        const duration = reducedMotion ? 0.01 : TIMING.duration.fast;
        const stagger = reducedMotion ? 0 : { amount: TIMING.stagger.tight };
        const ctaButton = '.cta > button';

        tl.set(ctaButton, { transition: 'none' })
            .to('.hero-line, .nav-links-line', {
                autoAlpha: 0,
                duration,
                ease: TIMING.easing.bounce,
                scaleX: 0,
            })
            .to(
                '.cta > a, .cta > button, .hero-content > p, .hero-content > h2, .hero-title-2, .hero-title-1, .hero-content > h3',
                {
                    autoAlpha: 0,
                    duration,
                    ease: TIMING.easing.smooth,
                    scale: reducedMotion ? 1 : 0.98,
                    stagger,
                    y: reducedMotion ? 0 : -10,
                },
                0,
            )
            .to(
                '.nav-link',
                {
                    duration: reducedMotion ? 0.01 : TIMING.duration.normal,
                    ease: TIMING.easing.smooth,
                    opacity: 0,
                    stagger: reducedMotion ? 0 : -TIMING.stagger.tight,
                    x: reducedMotion ? 0 : 50,
                },
                0,
            )
            .to(
                '.contact-link',
                {
                    autoAlpha: 0,
                    duration,
                    ease: TIMING.easing.smooth,
                    scale: reducedMotion ? 1 : 0.9,
                    stagger: reducedMotion ? 0 : TIMING.stagger.instant,
                    y: reducedMotion ? 0 : -8,
                },
                0,
            )
            .set(ctaButton, { clearProps: 'transition' });
    },
};
