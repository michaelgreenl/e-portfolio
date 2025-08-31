// :initial="{ opacity: 0, scaleX: 0 }"
// :enter="{ opacity: 1, scaleX: 1, transition: { duration: 200, easing: 'easeIn', delay: 50 } }"

export const Motions = {
    directives: {
        'fade-in': {
            initial: { opacity: 0 },
            enter: { opacity: 1, transition: { duration: 100, easing: 'easeInOut' } },
        },
        'fade-in-once': {
            initial: { opacity: 0 },
            visibleOnce: { opacity: 1, transition: { duration: 200, easing: 'easeInOut' } },
        },
        'fade-in-scalex': {
            initial: { opacity: 0, scaleX: 0 },
            enter: { opacity: 1, scaleX: 1, transition: { duration: 200, easing: 'easeInOut' } },
        },
        'slide-up-scalex': {
            initial: { y: 150, scaleX: 0 },
            enter: { y: 0, scaleX: 1, transition: { duration: 100, easing: 'easeInOut' } },
        },
        'fade-slide-right': {
            initial: { opacity: 0, x: -150 },
            enter: {
                opacity: 1,
                x: 0,
                transition: { duration: 100, easing: 'easeInOut' },
            },
        },
        'fade-slide-left': {
            initial: { opacity: 0, x: 50 },
            enter: {
                opacity: 1,
                x: 0,
                transition: { duration: 100, easing: 'easeInOut' },
            },
        },
        'fade-slide-in-scalex': {
            initial: { opacity: 0, x: -50, scaleX: 0.5 },
            enter: {
                opacity: 1,
                x: 0,
                scaleX: 1,
                transition: { duration: 100, easing: 'easeIn' },
            },
        },
    },
};
