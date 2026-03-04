import { onUnmounted, shallowRef } from 'vue';
import { gsap } from 'gsap';

export function useGsap(scope) {
    const ctx = shallowRef(null);

    const init = () => {
        if (!ctx.value) {
            ctx.value = gsap.context(() => {}, scope ? scope.value : undefined);
        }
    };

    const registerAnim = (animationLogic) => {
        return (userOptions = {}) => {
            init();

            const defaults = {
                tl: gsap.timeline(),
                delay: 0,
                onComplete: () => {},
                onStart: () => {},
                ...userOptions,
            };

            let returnedClosure;
            ctx.value.add(() => {
                returnedClosure = animationLogic(defaults);
            });

            if (typeof returnedClosure === 'function') {
                return (...args) => {
                    ctx.value.add(() => {
                        returnedClosure(...args);
                    });
                    return defaults.tl;
                };
            }

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
