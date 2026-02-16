import { TIMING } from '@/animations/constants/timing.js';

export const navbarAnimations = {
    enterMobileNavbar: ({ tl }) => {
        tl.to('.nav-mobile', {
            duration: TIMING.duration.normal,
            ease: TIMING.easing.smooth,
            y: 0,
            scaleX: 1,
        });
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
