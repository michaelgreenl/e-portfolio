import { gsap } from 'gsap';
import { TIMING } from '@/animations/constants/timing.js';

export const resumeAnimations = {
    enterPage: ({ tl }) => {
        gsap.set(
            '.page-title > h1, .page-title > span, .download-link, .section-header, .section-content, .segment-header, .segment-info > li, .segment-details',
            {
                opacity: 0,
            },
        );

        tl.to(
            '.page-title > h1, .page-title > span, .download-link, .section-header, .section-content, .segment-header, .segment-info > li, .segment-details',
            {
                duration: TIMING.duration.moderate,
                ease: TIMING.easing.linear,
                opacity: 1,
                stagger: TIMING.stagger.tight,
            },
        );
    },
    exitPage: ({ tl }) => {
        tl.to('.section-content, .section-header, .download-link, .page-title > span, .page-title > h1', {
            duration: TIMING.duration.normal,
            ease: TIMING.easing.linear,
            opacity: 0,
            stagger: TIMING.stagger.instant,
        });
    },
};
