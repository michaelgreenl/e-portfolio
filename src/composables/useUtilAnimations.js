import { gsap } from 'gsap';
import Flip from 'gsap/Flip';
import { useGsap } from '@/composables/useGsap.js';
import { TIMING } from '@/animations/constants/timing.js';

gsap.registerPlugin(Flip);

export function useUtilAnimations() {
    const { registerAnim } = useGsap();

    const flipFrom = ({ state, opts, onComplete = () => {} }) => {
        Flip.from(state, {
            duration: TIMING.duration.normal,
            ease: TIMING.easing.smooth,
            ...opts,
            onComplete,
        });
    };

    const fadeIn = registerAnim(({ selector, opts, onComplete }) => {
        gsap.set(selector, { opacity: 0 });
        gsap.to(selector, {
            duration: TIMING.duration.fast,
            ease: TIMING.easing.linear,
            opacity: 1,
            ...opts,
            onComplete,
        });
    });

    const fadeOut = registerAnim(({ selector, opts, onComplete }) => {
        gsap.set(selector, { opacity: 1 });
        gsap.to(selector, {
            duration: TIMING.duration.fast,
            ease: TIMING.easing.linear,
            opacity: 0,
            ...opts,
            onComplete,
        });
    });

    const headerReveal = registerAnim(({ tl, headerEl, extraTargets = [] }) => {
        const children = headerEl.querySelectorAll('h1, hr, p');
        const hr = headerEl.querySelector('hr');

        gsap.set([...children, ...extraTargets], { opacity: 0 });
        gsap.set(hr, { scaleX: 0 });

        tl.to([...children, ...extraTargets], {
            duration: TIMING.duration.normal,
            ease: TIMING.easing.linear,
            opacity: 1,
            stagger: TIMING.stagger.tight,
        }).to(
            hr,
            {
                duration: TIMING.duration.moderate,
                ease: TIMING.easing.bounce,
                scaleX: 1,
            },
            0.3,
        );
    });

    const headerDismiss = registerAnim(({ tl, headerEl, extraTargets = [] }) => {
        const children = headerEl.querySelectorAll('h1, hr, p');
        const hr = headerEl.querySelector('hr');

        tl.to([...children, ...extraTargets], {
            duration: TIMING.duration.fast,
            ease: TIMING.easing.linear,
            opacity: 0,
            stagger: TIMING.stagger.instant,
        }).to(
            hr,
            {
                duration: TIMING.duration.normal,
                ease: TIMING.easing.bounce,
                scaleX: 0,
            },
            0.1,
        );
    });

    return {
        flipFrom,
        fadeIn,
        fadeOut,
        headerReveal,
        headerDismiss,
    };
}
