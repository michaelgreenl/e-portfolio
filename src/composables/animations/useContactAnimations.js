import { gsap } from 'gsap';
import { useGsap } from '@/composables/useGsap.js';

export function useContactAnimations() {
    const { registerAnim } = useGsap();

    const enterPageAnim = registerAnim(({ tl }) => {
        gsap.set(
            '.contact-header h1, .contact-header hr, .contact-header p, .form-label, .form-input, .form-textarea, .contact-link',
            { opacity: 0 },
        );
        gsap.set('.contact-header hr', { scaleX: 0 });

        const fadeInOpts = {
            duration: 0.2,
            ease: 'linear',
            opacity: 1,
            stagger: 0.05,
        };

        tl.to('.contact-header h1, .contact-header hr, .contact-header p', {
            duration: 0.3,
            ease: 'linear',
            opacity: 1,
            stagger: 0.1,
        })
            .to('.contact-header hr', { duration: 0.4, ease: 'power4.out', scaleX: 1 }, 0.3)
            .to('.form-label', fadeInOpts, 0.3)
            .to('.form-input, .form-textarea', fadeInOpts, 0.3)
            .to('.contact-link', fadeInOpts, 0.6);
    });

    const exitPageAnim = registerAnim(({ tl }) => {
        const fadeOutOpts = {
            duration: 0.2,
            ease: 'linear',
            opacity: 0,
            stagger: 0.05,
        };

        tl.to('.contact-header h1, .contact-header hr, .contact-header p', {
            duration: 0.2,
            ease: 'linear',
            opacity: 0,
        })
            .to('.contact-header hr', { duration: 0.1, ease: 'power4.in', scaleX: 0 }, 0)
            .to('.form-label', fadeOutOpts, 0)
            .to('.form-input, .form-textarea', fadeOutOpts, 0)
            .to('.contact-link', fadeOutOpts, 0);
    });

    return {
        enterPageAnim,
        exitPageAnim,
    };
}
