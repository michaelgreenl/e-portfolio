// The small world the camera flies through between pages: the Earth in the middle, a satellite in a low
// orbit with its dish aimed at the Earth, a rocket above the Earth, and Jupiter far away. The rocket and the
// satellite are tiny next to the Earth, so the camera zooms a long way between them. Sizes and distances are
// made up so each trip reads well; they are not to scale.
//
// Each object keeps its scene in its own units: position is where the scene's origin sits in the world, scale
// is world units per scene unit, and turn rotates the scene about the world's vertical axis.

import { createEarth } from './scenes/earth.js';
import { createJupiter } from './scenes/jupiter.js';
import { createRocket } from './scenes/rocket.js';
import { createSatellite } from './scenes/satellite.js';

export function createWorld() {
    return {
        earth: { scene: createEarth(), position: [0, 0, 0], scale: 1, turn: 0 },
        satellite: { scene: createSatellite(), position: [8.4, 3.4, -2.2], scale: 0.05, turn: 0 },
        rocket: {
            scene: createRocket(),
            position: [0, 10.5, 0],
            scale: 0.05,
            turn: 0,
            // On the way between the Earth and the rocket, the rocket lifts off from the top of the Earth or
            // lands back on it.
            launch: { from: 'earth', pad: [0, 6, 0] },
        },
        jupiter: { scene: createJupiter(), position: [-700, 200, -1200], scale: 6, turn: 0 },
    };
}
