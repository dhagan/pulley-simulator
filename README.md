# Rope & Pulley Simulator

A physics-based simulator for creating and testing rope and pulley systems.

## Current Status

### ✅ Working Features
- Grid snapping (50px grid)
- Inelastic rope physics (stiffness=1, damping=0.1)
- Drawing blocked during simulation
- Basic physics simulation with Matter.js
- Tools: Pulley, Weight, Anchor, Rope, Select
- Play/Pause/Reset controls

### 🚧 In Progress (Needed Updates)
1. **Constant Gravity** - Remove slider, make gravity constant at 9.8 m/s²
2. **Pulley Friction** - Move friction to be pulley-specific property
3. **Mass Labels** - Show mass value on weight objects
4. **Rope Tension** - Calculate and display tension in ropes
5. **On-Screen Console** - Show logs in UI instead of just browser console
6. **Remove Header** - Maximize canvas space by removing header section

## Running the Simulator

1. Start the server:
   ```
   python -m http.server 8000
   ```

2. Open in browser:
   ```
   http://localhost:8000/index.html
   ```

3. Run tests:
   ```
   http://localhost:8000/tests.html
   ```

## Files

- `index.html` - Main simulator interface
- `styles.css` - UI styling
- `app.js` - Physics simulation logic
- `tests.html` - Visual integration tests
- `rope-test.html` - Rope physics test scenario

## Next Steps

The HTML file needs to be fixed due to corruption during edits. The app.js file is working correctly with all the physics features implemented.

### To Fix

1. Rebuild `index.html` with:
   - Header removed
   - Gravity constant (no slider)
   - Pulley friction slider
   - Mass slider for weights
   
2. Update `app.js` to add:
   - Mass labels on weight rendering
   - Rope tension calculation
   - On-screen console log panel

## Grid System

Objects snap to 50px grid:
- Pulleys: center on grid intersections
- Weights: center on grid intersections
- Anchors: center on grid intersections
- Ropes: endpoints snap to grid

## Physics Parameters

- **Gravity**: 9.8 m/s² (constant)
- **Rope Stiffness**: 1.0 (inelastic)
- **Rope Damping**: 0.1 (reduced oscillation)
- **Grid Size**: 50 pixels
