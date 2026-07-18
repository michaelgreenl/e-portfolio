import { gsap } from 'gsap';
import { TIMING } from '@/animations/constants/timing.js';

export const navbarAnimations = {
    enterMobileNavbar: ({ tl, reducedMotion }) => {
        gsap.set('.nav-mobile', { y: 200, width: '1em' });
        gsap.set('.nav-mobile > .active-item-bg', { opacity: 0 });
        gsap.set('.nav-mobile > .mobile-nav-button', {
            autoAlpha: 0,
            scale: reducedMotion ? 1 : 0.94,
            y: reducedMotion ? 0 : 18,
        });

        tl.to('.nav-mobile', {
            duration: TIMING.duration.normal,
            ease: TIMING.easing.organic,
            y: 0,
        })
            .to('.nav-mobile', {
                duration: TIMING.duration.normal,
                ease: TIMING.easing.organic,
                width: 'auto',
            })
            .to(
                '.nav-mobile > .active-item-bg',
                {
                    duration: TIMING.duration.fast,
                    ease: TIMING.easing.linear,
                    opacity: 1,
                },
                `<${TIMING.duration.normal}`,
            )
            .to(
                '.nav-mobile > .mobile-nav-button',
                {
                    autoAlpha: 1,
                    duration: reducedMotion ? 0.01 : TIMING.duration.moderate,
                    ease: TIMING.easing.smooth,
                    scale: 1,
                    stagger: reducedMotion ? 0 : TIMING.stagger.tight,
                    y: 0,
                },
                // `<${TIMING.duration.normal}`,
                `<`,
            );
    },

    enterLogoTheme: ({ tl }) => {
        tl.to(
            '.logo, .theme-toggle',
            {
                duration: TIMING.duration.moderate,
                ease: TIMING.easing.linear,
                opacity: 1,
            },
            0,
        ).to(
            '.nav-line',
            {
                duration: TIMING.duration.verySlow,
                ease: TIMING.easing.bounce,
                opacity: 1,
                scaleX: 1,
            },
            0,
        );
    },

    enterNavItem: ({ tl }) => {
        tl.to('.nav-item', {
            duration: TIMING.duration.fast,
            ease: TIMING.easing.smooth,
            opacity: 1,
            x: 0,
            scaleX: 1,
            stagger: TIMING.stagger.normal,
        });
    },

    exitNavItem: ({ tl }) => {
        tl.to('.nav-item', {
            duration: TIMING.duration.normal,
            ease: TIMING.easing.smooth,
            opacity: 0,
            x: -50,
            scaleX: 0.5,
            stagger: TIMING.stagger.tight,
        });
    },

    enterPage: ({ tl, isHomePage, enterNavItem, enterLogoTheme, enterMobileNavbar }) => {
        if (isHomePage) {
            enterLogoTheme();
        } else {
            enterNavItem({ tl });
            enterLogoTheme({ tl });
        }
        enterMobileNavbar();
    },
};
