// Rope & Pulley Simulator - Clean rebuild
const { Engine, Render, Runner, Bodies, Composite, Constraint, Mouse, MouseConstraint, Events, Body } = Matter;

const App = {
    engine: null, render: null, runner: null, mouse: null, mouseConstraint: null,
    currentTool: 'pulley', isSimulating: false, objects: [], selectedObject: null, ropeStart: null,
    showGrid: true, showDebug: false,
    settings: { gravity: 9.8, friction: 0.1, mass: 10 },
    canvas: null, ctx: null, width: 0, height: 0
};

function snapToGrid(v) { return Math.round(v / GRID_SIZE) * GRID_SIZE; }

function init() {
    App.canvas = document.getElementById('canvas');
    if (!App.canvas) return;
    App.ctx = App.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    App.engine = Engine.create();
    App.engine.gravity.y = 0.98;
    App.render = Render.create({
        canvas: App.canvas, engine: App.engine,
        options: { width: App.width, height: App.height, wireframes: false, background: 'transparent' }
    });
    App.runner = Runner.create();
    App.mouse = Mouse.create(App.canvas);
    App.mouseConstraint = MouseConstraint.create(App.engine, {
        mouse: App.mouse, constraint: { stiffness: 0.2, render: { visible: false } }
    });
    createGround();
    setupEventListeners();
    setupKeyboardShortcuts();
    Render.run(App.render);
    requestAnimationFrame(renderOverlay);
    setTool('pulley');
}

function resizeCanvas() {
    const c = App.canvas.parentElement;
    App.width = c.clientWidth;
    App.height = c.clientHeight;
    App.canvas.width = App.width;
    App.canvas.height = App.height;
    if (App.render) {
        App.render.bounds.max.x = App.width;
        App.render.bounds.max.y = App.height;
        App.render.options.width = App.width;
        App.render.options.height = App.height;
    }
}

function createGround() {
    const cfg = ObjectConfig.ground;
    Composite.add(App.engine.world, Bodies.rectangle(App.width / 2, App.height - 10, App.width, cfg.height, {
        isStatic: true,
        render: { fillStyle: cfg.fillColor, strokeStyle: cfg.strokeColor, lineWidth: cfg.lineWidth },
        label: 'ground'
    }));
}

function renderOverlay() {
    const ctx = App.ctx;
    ctx.clearRect(0, 0, App.width, App.height);
    if (App.showGrid) drawGrid(ctx);
    if (App.showDebug) drawDebugInfo(ctx);
    requestAnimationFrame(renderOverlay);
}

function drawGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < App.width; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, App.height); ctx.stroke();
    }
    for (let y = 0; y < App.height; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(App.width, y); ctx.stroke();
    }
    ctx.restore();
}

function drawDebugInfo(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(127,90,240,0.9)';
    ctx.font = '14px monospace';
    const info = [`Tool: ${App.currentTool}`, `Objects: ${App.objects.length}`, `Sim: ${App.isSimulating}`];
    info.forEach((t, i) => ctx.fillText(t, 10, 20 + i * 20));
    ctx.restore();
}

function setupEventListeners() {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
    document.getElementById('playBtn')?.addEventListener('click', startSimulation);
    document.getElementById('pauseBtn')?.addEventListener('click', pauseSimulation);
    document.getElementById('resetBtn')?.addEventListener('click', resetSimulation);
    document.getElementById('clearBtn')?.addEventListener('click', clearAll);
    document.getElementById('pulleyFriction')?.addEventListener('input', e => {
        App.settings.friction = parseFloat(e.target.value);
        document.getElementById('pulleyFrictionValue').textContent = App.settings.friction.toFixed(2);
    });
    document.getElementById('massSlider')?.addEventListener('input', e => {
        App.settings.mass = parseFloat(e.target.value);
        document.getElementById('massValue').textContent = App.settings.mass.toFixed(0);
    });
    document.getElementById('gridToggle')?.addEventListener('click', () => {
        App.showGrid = !App.showGrid;
        document.getElementById('gridToggle').classList.toggle('active');
    });
    document.getElementById('debugToggle')?.addEventListener('click', () => {
        App.showDebug = !App.showDebug;
        document.getElementById('debugToggle').classList.toggle('active');
    });
    document.getElementById('helpBtn')?.addEventListener('click', () => document.getElementById('helpModal').classList.add('show'));
    document.getElementById('closeHelp')?.addEventListener('click', () => document.getElementById('helpModal').classList.remove('show'));
    App.canvas.addEventListener('click', handleCanvasClick);
    App.canvas.addEventListener('contextmenu', e => e.preventDefault());
    Events.on(App.mouseConstraint, 'mousedown', e => {
        if (App.currentTool === 'select' && e.source.body) App.selectedObject = e.source.body;
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        if (e.key === 's' || e.key === 'S') setTool('select');
        if (e.key === 'p' || e.key === 'P') setTool('pulley');
        if (e.key === 'w' || e.key === 'W') setTool('weight');
        if (e.key === 'r' || e.key === 'R') setTool('rope');
        if (e.key === 'a' || e.key === 'A') setTool('anchor');
        if (e.key === ' ') { e.preventDefault(); App.isSimulating ? pauseSimulation() : startSimulation(); }
        if (e.key === 'Escape') resetSimulation();
        if (e.key === 'Delete' && App.selectedObject) deleteObject(App.selectedObject);
    });
}

function setTool(tool) {
    App.currentTool = tool;
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
    if (tool === 'select') {
        App.canvas.style.cursor = 'default';
        Composite.add(App.engine.world, App.mouseConstraint);
    } else {
        App.canvas.style.cursor = 'crosshair';
        Composite.remove(App.engine.world, App.mouseConstraint);
    }
    App.ropeStart = null;
    document.getElementById('instructions')?.classList.add('hide');
}

function handleCanvasClick(e) {
    if (App.isSimulating) return;
    const rect = App.canvas.getBoundingClientRect();
    let x = snapToGrid(e.clientX - rect.left);
    let y = snapToGrid(e.clientY - rect.top);
    switch (App.currentTool) {
        case 'pulley': createPulley(x, y); break;
        case 'weight': createWeight(x, y); break;
        case 'anchor': createAnchor(x, y); break;
        case 'rope': handleRopeClick(x, y); break;
    }
}

function createPulley(x, y) {
    const cfg = ObjectConfig.pulley;
    const p = Bodies.circle(x, y, cfg.radius, {
        isStatic: true,
        render: { fillStyle: cfg.fillColor, strokeStyle: cfg.strokeColor, lineWidth: cfg.lineWidth },
        friction: App.settings.friction, label: 'pulley'
    });
    const c = Bodies.circle(x, y, cfg.centerRadius, {
        isStatic: true, render: { fillStyle: cfg.strokeColor }, label: 'pulley-center'
    });
    Composite.add(App.engine.world, [p, c]);
    App.objects.push(p);
}

function createWeight(x, y) {
    const cfg = ObjectConfig.weight;
    const w = Bodies.rectangle(x, y, cfg.size, cfg.size, {
        density: App.settings.mass / 100, friction: App.settings.friction,
        render: { fillStyle: cfg.fillColor, strokeStyle: cfg.strokeColor, lineWidth: cfg.lineWidth },
        label: 'weight'
    });
    Composite.add(App.engine.world, w);
    App.objects.push(w);
}

function createAnchor(x, y) {
    const cfg = ObjectConfig.anchor;
    const a = Bodies.rectangle(x, y, cfg.width, cfg.height, {
        isStatic: true,
        render: { fillStyle: cfg.fillColor, strokeStyle: cfg.strokeColor, lineWidth: cfg.lineWidth },
        label: 'anchor'
    });
    Composite.add(App.engine.world, a);
    App.objects.push(a);
}

function handleRopeClick(x, y) {
    const bodies = Composite.allBodies(App.engine.world);
    const clickedBody = Matter.Query.point(bodies, { x, y })[0];
    if (!App.ropeStart) {
        App.ropeStart = { x, y, body: clickedBody && clickedBody.label !== 'ground' ? clickedBody : null };
    } else {
        const endBody = clickedBody && clickedBody.label !== 'ground' ? clickedBody : null;
        createRope(App.ropeStart, { x, y, body: endBody });
        App.ropeStart = null;
    }
}

function createRope(start, end) {
    const cfg = ObjectConfig.rope;
    const dist = Math.hypot(end.x - start.x, end.y - start.y);
    const segs = Math.max(cfg.minSegments, Math.floor(dist / cfg.segmentSpacing));
    const ropeSegs = [];
    for (let i = 0; i < segs; i++) {
        const t = i / segs;
        const segment = Bodies.circle(
            start.x + (end.x - start.x) * t,
            start.y + (end.y - start.y) * t,
            2,
            {
                density: cfg.density, friction: cfg.friction,
                render: { fillStyle: cfg.strokeColor, strokeStyle: cfg.strokeColor, lineWidth: 1 },
                collisionFilter: { group: -1 }, label: 'rope-segment'
            }
        );
        ropeSegs.push(segment);
    }
    Composite.add(App.engine.world, ropeSegs);
    for (let i = 0; i < ropeSegs.length - 1; i++) {
        Composite.add(App.engine.world, Constraint.create({
            bodyA: ropeSegs[i], bodyB: ropeSegs[i + 1],
            length: dist / segs, stiffness: cfg.stiffness, damping: cfg.damping, render: { visible: false }
        }));
    }
    if (start.body) {
        Composite.add(App.engine.world, Constraint.create({
            bodyA: start.body, bodyB: ropeSegs[0],
            pointA: { x: start.x - start.body.position.x, y: start.y - start.body.position.y },
            length: 0, stiffness: cfg.stiffness, damping: cfg.damping, render: { visible: false }
        }));
    } else {
        Body.setStatic(ropeSegs[0], true);
    }
    if (end.body) {
        Composite.add(App.engine.world, Constraint.create({
            bodyA: ropeSegs[ropeSegs.length - 1], bodyB: end.body,
            pointB: { x: end.x - end.body.position.x, y: end.y - end.body.position.y },
            length: 0, stiffness: cfg.stiffness, damping: cfg.damping, render: { visible: false }
        }));
    } else {
        Body.setStatic(ropeSegs[ropeSegs.length - 1], true);
    }
    App.objects.push(...ropeSegs);
}

function startSimulation() {
    App.isSimulating = true;
    Runner.run(App.runner, App.engine);
    document.getElementById('playBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'flex';
    setTool('select');
}

function pauseSimulation() {
    App.isSimulating = false;
    Runner.stop(App.runner);
    document.getElementById('playBtn').style.display = 'flex';
    document.getElementById('pauseBtn').style.display = 'none';
}

function resetSimulation() {
    pauseSimulation();
    Composite.allBodies(App.engine.world).forEach(b => {
        Body.setVelocity(b, { x: 0, y: 0 });
        Body.setAngularVelocity(b, 0);
    });
}

function clearAll() {
    if (confirm('Clear everything?')) {
        pauseSimulation();
        Engine.clear(App.engine);
        App.objects = [];
        App.selectedObject = null;
        App.ropeStart = null;
        createGround();
        document.getElementById('instructions')?.classList.remove('hide');
    }
}

function deleteObject(body) {
    Composite.remove(App.engine.world, body);
    const idx = App.objects.indexOf(body);
    if (idx > -1) App.objects.splice(idx, 1);
    App.selectedObject = null;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
