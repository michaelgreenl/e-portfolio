// Page enter and exit animations run at this speed, so the page content keeps pace with the ASCII camera's
// trip between pages.
export const PAGE_TIME_SCALE = 0.75;

// How long the old page has to leave before the route changes, in ms.
export const LEAVE_DURATION = 350 / PAGE_TIME_SCALE;

export const TIMING = {
    duration: {
        instant: 0.15,
        fast: 0.2,
        normal: 0.3,
        moderate: 0.4,
        slow: 0.5,
        verySlow: 0.8,
    },
    stagger: {
        instant: 0.02,
        tight: 0.05,
        normal: 0.1,
        loose: 0.15,
    },
    easing: {
        linear: 'linear',
        smooth: 'power3.out',
        bounce: 'power4.out',
        bounceIn: 'power4.in',
        organic: 'circ',
    },
};
