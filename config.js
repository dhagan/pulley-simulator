// Grid Size (globally accessible)
const GRID_SIZE = 50;

// Object Configuration
const ObjectConfig = {
    pulley: {
        radius: 30,
        centerRadius: 5,
        fillColor: 'rgba(60, 40, 120, 0.8)',
        strokeColor: 'rgba(127, 90, 240, 1)',
        lineWidth: 3
    },

    weight: {
        size: 40,
        fillColor: 'rgba(255, 140, 60, 0.8)',
        strokeColor: 'rgba(255, 180, 100, 1)',
        lineWidth: 2
    },

    anchor: {
        width: 60,
        height: 20,
        fillColor: 'rgba(80, 80, 80, 0.9)',
        strokeColor: 'rgba(120, 120, 120, 1)',
        lineWidth: 2
    },

    rope: {
        segmentRadius: 4,
        segmentSpacing: 30,
        minSegments: 5,
        strokeColor: 'rgba(220, 220, 180, 1)',
        lineWidth: 3,
        // Physics properties
        density: 0.01,        // Increased for visible weight
        friction: 0.5,
        stiffness: 1,         // Max stiffness - no stretch
        damping: 0.1
    },

    ground: {
        height: 20,
        fillColor: 'rgba(127, 90, 240, 0.3)',
        strokeColor: 'rgba(127, 90, 240, 0.8)',
        lineWidth: 2
    }
};
