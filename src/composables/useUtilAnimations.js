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

    const fadeIn = registerAnim(({ selector, opts, onComplete, reducedMotion }) => {
        gsap.set(selector, { opacity: 0 });
        gsap.to(selector, {
            duration: reducedMotion ? 0.01 : TIMING.duration.fast,
            ease: TIMING.easing.linear,
            opacity: 1,
            ...opts,
            onComplete,
        });
    });

    const fadeOut = registerAnim(({ selector, opts, onComplete, reducedMotion }) => {
        gsap.set(selector, { opacity: 1 });
        gsap.to(selector, {
            duration: reducedMotion ? 0.01 : TIMING.duration.fast,
            ease: TIMING.easing.linear,
            opacity: 0,
            ...opts,
            onComplete,
        });
    });

    const revealIn = registerAnim(({ selector, opts, onComplete, reducedMotion }) => {
        gsap.set(selector, {
            autoAlpha: 0,
            scale: reducedMotion ? 1 : 0.98,
            y: reducedMotion ? 0 : 24,
        });
        gsap.to(selector, {
            autoAlpha: 1,
            clearProps: 'transform,visibility',
            duration: reducedMotion ? 0.01 : TIMING.duration.moderate,
            ease: TIMING.easing.smooth,
            scale: 1,
            y: 0,
            ...opts,
            onComplete,
        });
    });

    const headerReveal = registerAnim(({ tl, headerEl, extraTargets = [], reducedMotion }) => {
        const copy = headerEl.querySelectorAll('h1, p');
        const hr = headerEl.querySelector('hr');
        const duration = reducedMotion ? 0.01 : TIMING.duration.normal;

        gsap.set([...copy, ...extraTargets], {
            autoAlpha: 0,
            scale: reducedMotion ? 1 : 0.98,
            y: reducedMotion ? 0 : 18,
        });
        gsap.set(hr, { autoAlpha: 0, scaleX: 0 });

        tl.to(copy, {
            autoAlpha: 1,
            duration,
            ease: TIMING.easing.smooth,
            scale: 1,
            stagger: reducedMotion ? 0 : TIMING.stagger.tight,
            y: 0,
        }).to(
            hr,
            {
                autoAlpha: 1,
                duration: reducedMotion ? 0.01 : TIMING.duration.moderate,
                ease: TIMING.easing.bounce,
                scaleX: 1,
            },
            reducedMotion ? 0 : 0.08,
        );

        if (extraTargets.length > 0) {
            tl.to(
                extraTargets,
                {
                    autoAlpha: 1,
                    clearProps: 'transform,visibility',
                    duration,
                    ease: TIMING.easing.smooth,
                    scale: 1,
                    stagger: reducedMotion ? 0 : TIMING.stagger.tight,
                    y: 0,
                },
                reducedMotion ? 0 : 0.12,
            );
        }
    });

    const headerDismiss = registerAnim(({ tl, headerEl, extraTargets = [], reducedMotion }) => {
        const copy = headerEl.querySelectorAll('h1, p');
        const hr = headerEl.querySelector('hr');
        const duration = reducedMotion ? 0.01 : TIMING.duration.fast;
        const stagger = reducedMotion ? 0 : { amount: TIMING.stagger.tight };
        const targets = [...copy, ...gsap.utils.toArray(extraTargets)];

        tl.set(targets, { transition: 'none' })
            .to(targets, {
                autoAlpha: 0,
                duration,
                ease: TIMING.easing.smooth,
                scale: reducedMotion ? 1 : 0.98,
                stagger,
                y: reducedMotion ? 0 : -10,
            })
            .to(
                hr,
                {
                    autoAlpha: 0,
                    duration,
                    ease: TIMING.easing.bounce,
                    scaleX: 0,
                },
                0,
            )
            .set(targets, { clearProps: 'transition' });
    });

    return {
        flipFrom,
        fadeIn,
        fadeOut,
        revealIn,
        headerReveal,
        headerDismiss,
    };
}
