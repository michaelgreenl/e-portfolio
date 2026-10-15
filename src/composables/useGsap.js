import { onUnmounted, shallowRef } from 'vue';
import { gsap } from 'gsap';

export function useGsap(scope) {
    const ctx = shallowRef(null);

    const init = () => {
        if (!ctx.value) {
            ctx.value = gsap.context(() => {}, scope ? scope.value : undefined);
        }
    };

    // timeScale sets the speed of the timeline the animation builds, unless the caller passes its own.
    const registerAnim = (animationLogic, { timeScale = 1 } = {}) => {
        return (userOptions = {}) => {
            init();

            const defaults = {
                tl: gsap.timeline().timeScale(timeScale),
                delay: 0,
                onComplete: () => {},
                onStart: () => {},
                reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
                ...userOptions,
            };

            ctx.value.add(() => {
                animationLogic(defaults);
            });

            return defaults.tl;
        };
    };

    onUnmounted(() => {
        ctx.value?.revert();
    });

    return {
        registerAnim,
        ctx,
    };
}
