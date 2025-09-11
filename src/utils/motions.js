export const Motions = {
    directives: {
        'fade-in': {
            initial: { opacity: 0 },
            enter: { opacity: 1, transition: { duration: 100, easing: 'easeInOut' } },
            leave: { opacity: 0, transition: { duration: 100, easing: 'easeInOut' } },
        },
        'fade-in-leave': {
            leave: { opacity: 0, transition: { duration: 100, easing: 'easeInOut' } },
        },
        'fade-in-once': {
            initial: { opacity: 0 },
            visibleOnce: { opacity: 1, transition: { duration: 200, easing: 'easeInOut' } },
            leave: { opacity: 0, transition: { duration: 200, easing: 'easeInOut' } },
        },
        'fade-in-scalex': {
            initial: { opacity: 0, scaleX: 0 },
            enter: { opacity: 1, scaleX: 1, transition: { type: 'spring', stiffness: 250, damping: 25, mass: 0.5 } },
            leave: { opacity: 0, scaleX: 0, transition: { duration: 200, easing: 'easeInOut' } },
        },
        'slide-up-scalex': {
            initial: { y: 150, scaleX: 0 },
            enter: { y: 0, scaleX: 1, transition: { duration: 100, easing: 'easeInOut' } },
            leave: { y: 150, scaleX: 0, transition: { duration: 100, easing: 'easeInOut' } },
        },
        'fade-slide-right': {
            initial: { opacity: 0, x: -150 },
            enter: { opacity: 1, x: 0, transition: { duration: 100, easing: 'easeInOut' } },
            leave: { opacity: 0, x: -150, transition: { duration: 100, easing: 'easeInOut' } },
        },
        'fade-slide-left': {
            initial: { opacity: 0, x: 50 },
            enter: { opacity: 1, x: 0, transition: { duration: 100, easing: 'easeInOut' } },
        },
        'fade-slide-left-leave': {
            leave: { opacity: 0, x: 50, transition: { duration: 100, easing: 'easeInOut' } },
        },
        'fade-slide-in-scalex': {
            initial: { opacity: 0, x: -50, scaleX: 0.5 },
            enter: { opacity: 1, x: 0, scaleX: 1, transition: { duration: 100, easing: 'easeIn' } },
            leave: { opacity: 0, x: -50, scaleX: 0.5, transition: { duration: 100, easing: 'easeIn' } },
        },
    },
};
