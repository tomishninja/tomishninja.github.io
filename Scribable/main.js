const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =========================
// Camera class
// =========================
// This class handles the class the camera class allowing for the users view point to moveAbove
//
class Camera {
    constructor() {
        this.x = 0;        // world offset
        this.y = 0;
        this.zoom = 1.0;

        this.minZoom = 0.2;
        this.maxZoom = 5.0;
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1.0;
    }

    // Apply transform before drawing
    apply(ctx) {
        ctx.setTransform(
            this.zoom, 0,
            0, this.zoom,
            -this.x * this.zoom,
            -this.y * this.zoom
        );
    }

    // Convert screen → world
    screenToWorld(px, py) {
        return {
            x: (px / this.zoom) + this.x,
            y: (py / this.zoom) + this.y
        };
    }

    // Convert world → screen
    worldToScreen(px, py) {
        return {
            x: (px - this.x) * this.zoom,
            y: (py - this.y) * this.zoom
        };
    }

    // Zoom toward a screen point (important!)
    zoomAt(screenX, screenY, zoomFactor) {
        const before = this.screenToWorld(screenX, screenY);

        this.zoom *= zoomFactor;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));

        const after = this.screenToWorld(screenX, screenY);

        // Adjust camera so zoom centers on cursor
        this.x += before.x - after.x;
        this.y += before.y - after.y;
    }

    // Pan camera (drag)
    pan(dx, dy) {
        this.x -= dx / this.zoom;
        this.y -= dy / this.zoom;
    }
}

class Timer {
    constructor() {
        this.startTime = performance.now();
    }

    reset() {
        this.startTime = performance.now();
    }

    getElapsedTime() {
        return performance.now() - this.startTime;
    }
}

// =========================
// DATA STRUCTURES
// =========================

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.time = timer.getElapsedTime();
    }
}

// Quadratic Bézier segment:
// p0 -> p1 -> p2
class Segment {
    constructor(p0, p1, p2) {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
        this.time = timer.getElapsedTime();
    }
}

class Stroke {
    constructor() {
        this.segments = [];
        this.nodes = [];
        this.time = timer.getElapsedTime();
    }
}

// =========================
// SYSTEM STATE
// =========================

// sampling threshold (controls smoothness)
const SAMPLE_DIST = 6;
const camera = new Camera();
const timer = new Timer();

let strokes = [];
let currentStroke = null;
let isDrawing = false;

let isPanning = false;
let lastX = 0;
let lastY = 0;

// =========================
// INPUT HANDLING
// =========================

let lastPoint = null;

canvas.addEventListener("mousedown", (e) => handleMouseDown(e));
canvas.addEventListener("touchstart", (e) => handleTouchStart(e));
canvas.addEventListener("mousemove", (e) => handleMouseMove(e));
canvas.addEventListener("touchmove", (e) => handleTouchMove(e));
canvas.addEventListener("mouseup", (e) => handleMouseUp(e));
canvas.addEventListener("touchend", (e) => handleMouseUp(e));
canvas.addEventListener("wheel", (e) => handleMouseWheel(e));

// =========================
// Event Listener functions
// =========================
function handleDrawStart(x, y) {
    isDrawing = true;

	currentStroke = new Stroke();
	strokes.push(currentStroke);
		
	uv = camera.screenToWorld(x, y);
	const p = new Node(uv.x, uv.y);

	currentStroke.nodes.push(p);
	lastPoint = p;
}

function handleMouseDown(e) {
	if (e.button === 1 || e.button === 2) { // middle or right click
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
    } else {
		handleDrawStart(e.clientX, e.clientY);
	}
}

function handleTouchStart(e) {
    if (e.touches.length === 1) { // single touch for drawing
        const touch = e.touches[0];
        handleDrawStart(touch.clientX, touch.clientY);
    } else if (e.touches.length === 2) { // two fingers for panning
        isPanning = true;
        lastX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        lastY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
}

function handleContinuePanning(x, y) {
    const dx = x - lastX;
	const dy = y - lastY;

	camera.pan(dx, dy);

	lastX = x;
	lastY = y;
}

function handleContinueDrawing(x, y) {
    const uv = camera.screenToWorld(x, y);
	const p = new Node(uv.x, uv.y);

	const dx = p.x - lastPoint.x;
	const dy = p.y - lastPoint.y;
	const dist = Math.sqrt(dx * dx + dy * dy);

    
	// adaptive sampling (important for your system)
	if (dist < SAMPLE_DIST) return;
    // TODO the obove line needs to be changed to allow for the drawings of dots
		
	currentStroke.nodes.push(p);

	// build Bézier segment (simple heuristic)
	if (currentStroke.nodes.length >= 3) {
		const n = currentStroke.nodes;

		const p0 = n[n.length - 3];
		const p1 = n[n.length - 2];
		const p2 = n[n.length - 1];

		currentStroke.segments.push(new Segment(p0, p1, p2));
	}
	lastPoint = p;
}

function handleMouseMove(e) {
	if (isPanning) {
        handleContinuePanning(e.clientX, e.clientY);
	} else if (isDrawing) {
		handleContinueDrawing(e.clientX, e.clientY);
	}
}

function handleTouchMove(e) {
    if (e.touches.length === 1 && isDrawing) { // single touch for drawing
        const touch = e.touches[0]; 
        handleContinueDrawing(touch.clientX, touch.clientY);
    } else if (e.touches.length === 2 && isPanning) { // two fingers for panning
        const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        handleContinuePanning(x, y);
    }
}

function handleMouseUp(e) {
    if (!isPanning) {
		rebuildSegments(currentStroke)
		isDrawing = false;
		currentStroke = null;
		lastPoint = null;
	} else {
		isPanning = false
	}
}

function handleMouseWheel(e) {
    e.preventDefault();

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

    camera.zoomAt(e.clientX, e.clientY, zoomFactor);
}

// =========================
// RENDERING
// =========================

// function render() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
// 
//     ctx.lineWidth = 2;
//     ctx.strokeStyle = "white";
// 
//     for (const stroke of strokes) {
//         for (const seg of stroke.segments) {
//             drawBezier(seg);
//         }
//     }
// 
//     requestAnimationFrame(render);
// }

function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    camera.apply(ctx);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "white";

    for (const stroke of strokes) {
        for (const seg of stroke.segments) {
            drawBezier(seg);
        }
    }

    requestAnimationFrame(render);
}

function drawBezier(seg) {
    ctx.beginPath();
    ctx.moveTo(seg.p0.x, seg.p0.y);
    ctx.quadraticCurveTo(seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
    ctx.stroke();
}

// =========================
// Functions
// =========================

// 
// Rebuilds the line segments in a manner that is more visually appealing.
//
function rebuildSegments(stroke) {
    if (!stroke) return;

    stroke.segments = [];

    const n = stroke.nodes;
    if (n.length < 3) return;

    for (let i = 0; i < n.length - 2; i += 1) {
        stroke.segments.push(
            new Segment(n[i], n[i+1], n[i+2])
        );
    }
}

function clearCanvas() {
    // Finalize any in-progress stroke/pan (same as mouseUp logic)
    isDrawing = false;
    isPanning = false;
    currentStroke = null;
    lastPoint = null;
    // Clear everything
    strokes = [];
    lastX = 0;
    lastY = 0;
    camera.reset();
    timer.reset();
}

// ============================
// Start up
// ============================

render();
