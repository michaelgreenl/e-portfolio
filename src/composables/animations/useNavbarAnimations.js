import { gsap } from 'gsap';
import { useGsap } from '@/composables/useGsap.js';

export function useNavbarAnimations() {
    const { registerAnim } = useGsap();

    const enterPageAnim = registerAnim(({ tl, isHomePage }) => {
        if (isHomePage) {
            enterLogoTheme();
        } else {
            enterNavItemAnim({ tl });
            enterLogoTheme({ tl });
        }

        enterMobileNavbar();
    });

    const enterMobileNavbar = registerAnim(({ tl }) => {
        tl.to('.nav-mobile', { duration: 0.3, ease: 'power3.out', y: 0, scaleX: 1 });
    });

    const enterLogoTheme = registerAnim(({ tl }) => {
        tl.to('.logo, .theme-toggle', { duration: 0.4, ease: 'linear', opacity: 1 }, 0).to(
            '.nav-line',
            { duration: 0.8, ease: 'power4.out', opacity: 1, scaleX: 1 },
            0,
        );
    });

    const enterNavItemAnim = registerAnim(({ tl }) => {
        tl.to('.nav-item', { duration: 0.2, ease: 'power3.out', opacity: 1, x: 0, scaleX: 1, stagger: 0.1 });
    });

    const exitNavItemAnim = registerAnim(({ tl }) => {
        tl.to('.nav-item', { duration: 0.3, ease: 'power3.out', opacity: 0, x: -50, scaleX: 0.5, stagger: 0.05 });
    });

    return {
        enterPageAnim,
        enterNavItemAnim,
        exitNavItemAnim,
    };
}
