import { gsap } from 'gsap';
import { TIMING } from '@/animations/constants/timing.js';

const DESKTOP_CONTACT_TARGET = '.contact-links-desktop';
const DESKTOP_CONTACT_LINK_TARGETS = `${DESKTOP_CONTACT_TARGET} .contact-link`;
const MOBILE_CONTACT_TARGETS = '.contact-links-mobile .contact-link';

export const homeAnimations = {
    enterPage: ({ tl, reducedMotion }) => {
        const duration = reducedMotion ? 0.01 : TIMING.duration.moderate;
        const stagger = reducedMotion ? 0 : TIMING.stagger.tight;
        const desktopContactTarget = document.querySelector(DESKTOP_CONTACT_TARGET);
        const desktopContactHeight = desktopContactTarget?.offsetHeight;
        const desktopContactLinkTargets = gsap.utils.toArray(DESKTOP_CONTACT_LINK_TARGETS);
        const mobileContactTargets = gsap.utils.toArray(MOBILE_CONTACT_TARGETS);

        gsap.set('.hero-content > h3', { autoAlpha: 0, y: reducedMotion ? 0 : -16 });
        // The title slides in without a scale: the ASCII art lines its rows up with the title's letters and moves
        // the greeting to them, so a scale that grows as the title lands would shift the greeting as it lands.
        gsap.set('.hero-title-1', { autoAlpha: 0, x: reducedMotion ? 0 : -48 });
        gsap.set('.hero-title-2', { autoAlpha: 0, x: reducedMotion ? 0 : 48 });
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
        // The lines draw in from their middle through a clip instead of a scale, so their boxes stay full width
        // and the art's rows, which the divider's width helps place on phones, hold still.
        gsap.set('.hero-line, .nav-links-line', {
            autoAlpha: 0,
            clipPath: 'inset(0 50%)',
        });
        if (desktopContactTarget) {
            gsap.set(desktopContactTarget, {
                height: 0,
                opacity: 0,
                overflow: 'hidden',
            });
            // The links' CSS transform transition, for their press effect, would trail GSAP's slide: they would
            // reach full opacity well short of their place and hold the art beside them open as they creep in.
            gsap.set(desktopContactLinkTargets, {
                opacity: 0,
                transition: 'none',
                x: reducedMotion ? 0 : 50,
            });
        }
        if (mobileContactTargets.length) {
            gsap.set(mobileContactTargets, {
                autoAlpha: 0,
                scale: reducedMotion ? 1 : 0.8,
                y: reducedMotion ? 0 : -12,
            });
        }

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
                    clearProps: 'transform',
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
                    clipPath: 'inset(0 0%)',
                    duration: reducedMotion ? 0.01 : TIMING.duration.slow,
                    ease: TIMING.easing.bounce,
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
            );

        // The contact links carry on the nav links' stagger, so they land with the rest of the row while the ASCII
        // Earth closes in around it, not after the Earth has settled.
        if (desktopContactTarget) {
            tl.to(
                desktopContactTarget,
                {
                    duration: reducedMotion ? 0.01 : TIMING.duration.normal,
                    ease: TIMING.easing.bounce,
                    height: desktopContactHeight,
                },
                reducedMotion ? 0 : 'hero+=0.3',
            )
                .set(desktopContactTarget, { clearProps: 'height,overflow' }, '>')
                // The ASCII art clears the row's divider at the row's opacity, so the row fades in with its links.
                // At full opacity from the start, the divider's cut jumps in over art the Earth has already drawn.
                .to(
                    desktopContactTarget,
                    {
                        duration: reducedMotion ? 0.01 : TIMING.duration.normal,
                        ease: TIMING.easing.organic,
                        opacity: 1,
                    },
                    reducedMotion ? 0 : 'hero+=0.4',
                )
                .to(
                    desktopContactLinkTargets,
                    {
                        clearProps: 'transform,transition',
                        duration: reducedMotion ? 0.01 : TIMING.duration.normal,
                        ease: TIMING.easing.organic,
                        opacity: 1,
                        stagger: reducedMotion ? 0 : TIMING.stagger.normal,
                        x: 0,
                    },
                    reducedMotion ? 0 : 'hero+=0.4',
                );
        }

        if (mobileContactTargets.length) {
            tl.to(
                mobileContactTargets,
                {
                    autoAlpha: 1,
                    clearProps: 'transform',
                    duration,
                    ease: TIMING.easing.smooth,
                    scale: 1,
                    stagger: reducedMotion ? 0 : TIMING.stagger.normal,
                    y: 0,
                },
                reducedMotion ? 0 : 'hero+=0.18',
            );
        }
    },

    exitPage: ({ tl, reducedMotion }) => {
        const duration = reducedMotion ? 0.01 : TIMING.duration.normal;
        const stagger = reducedMotion ? 0 : { amount: TIMING.stagger.tight };
        const ctaButton = '.cta > button';
        const desktopContactTarget = document.querySelector(DESKTOP_CONTACT_TARGET);
        const desktopContactLinkTargets = gsap.utils.toArray(DESKTOP_CONTACT_LINK_TARGETS);
        const mobileContactTargets = gsap.utils.toArray(MOBILE_CONTACT_TARGETS);

        if (desktopContactTarget) {
            tl.to(desktopContactLinkTargets, {
                duration,
                ease: TIMING.easing.fade,
                opacity: 0,
                stagger: reducedMotion ? 0 : { amount: TIMING.stagger.tight, from: 'end' },
                x: reducedMotion ? 0 : 50,
            }).to(
                desktopContactTarget,
                {
                    duration,
                    ease: TIMING.easing.fade,
                    height: 0,
                    overflow: 'hidden',
                },
                0,
            );
        }

        tl.set(ctaButton, { transition: 'none' }, 0)
            .to(
                '.cta > a, .cta > button, .hero-content > p, .hero-content > h2, .hero-title-2, .hero-title-1, .hero-content > h3',
                {
                    autoAlpha: 0,
                    duration,
                    ease: TIMING.easing.fade,
                    // The title keeps its size, as on entry, so the art's rows and the greeting hold still.
                    scale: (i, el) => (reducedMotion || el.matches('.hero-title') ? 1 : 0.98),
                    stagger,
                    y: reducedMotion ? 0 : -10,
                },
                0,
            )
            .to(
                '.hero-line, .nav-links-line',
                {
                    autoAlpha: 0,
                    clipPath: 'inset(0 50%)',
                    duration,
                    ease: TIMING.easing.fade,
                },
                0,
            )
            .to(
                '.nav-link',
                {
                    duration,
                    ease: TIMING.easing.fade,
                    opacity: 0,
                    stagger,
                    x: reducedMotion ? 0 : 50,
                },
                0,
            );

        if (mobileContactTargets.length) {
            tl.to(
                mobileContactTargets,
                {
                    autoAlpha: 0,
                    duration,
                    ease: TIMING.easing.fade,
                    scale: reducedMotion ? 1 : 0.9,
                    stagger,
                    y: reducedMotion ? 0 : -8,
                },
                0,
            );
        }

        tl.set(ctaButton, { clearProps: 'transition' });
    },
};
