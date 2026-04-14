/* Scene module: world state machine, particles, grain and adaptive performance. */

let sceneEl;
let particleCanvas;
let particleCtx;
let grainCanvas;
let grainCtx;

let worldState = 'night';
let lowPerformance = false;
let particleMultiplier = 1;

let particles = [];
const particlePool = [];
const MAX_POOL = 360;
let particleMode = 'star';

let lastMouseMove = 0;
const cursor = { x: 0, y: 0 };

let fpsHistory = [];
let perfTimer = 0;
let grainTimer = null;
let grainIntervalMs = 80;

let transition = null;

class Particle {
  constructor() {
    this.active = false;
    this.type = 'star';
    this.x = 0;
    this.y = 0;
    this.size = 1;
    this.opacity = 1;
    this.targetOpacity = 1;
    this.vx = 0;
    this.vy = 0;
    this.fadingOut = false;
    this.fadingIn = false;
  }
}

function acquireParticle() {
  const free = particlePool.find((p) => !p.active);
  if (!free) {
    return null;
  }
  free.active = true;
  return free;
}

function releaseParticle(particle) {
  particle.active = false;
}

function setupPool() {
  for (let i = 0; i < MAX_POOL; i += 1) {
    particlePool.push(new Particle());
  }
}

function setupCanvas(canvas, ctxRef) {
  if (!canvas) {
    return;
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  return ctxRef;
}

function createParticle(type) {
  const particle = acquireParticle();
  if (!particle) {
    return null;
  }

  particle.type = type;
  particle.x = Math.random() * particleCanvas.width;
  particle.y = Math.random() * particleCanvas.height;
  particle.fadingOut = false;
  particle.fadingIn = false;

  if (type === 'star') {
    particle.size = 0.5 + Math.random() * 1.5;
    particle.targetOpacity = 0.3 + Math.random() * 0.7;
    particle.opacity = particle.targetOpacity;
    particle.vx = (Math.random() - 0.5) * 0.03;
    particle.vy = (Math.random() - 0.5) * 0.03;
  } else {
    particle.size = 1 + Math.random() * 1.8;
    particle.targetOpacity = 0.35 + Math.random() * 0.2;
    particle.opacity = particle.targetOpacity;
    particle.vx = (Math.random() - 0.5) * 0.06;
    particle.vy = 0.02 + Math.random() * 0.03;
  }

  return particle;
}

function createStars(count = 180, fadeIn = false) {
  for (let i = 0; i < count; i += 1) {
    const p = createParticle('star');
    if (p) {
      if (fadeIn) {
        p.fadingIn = true;
        p.opacity = 0;
      }
      particles.push(p);
    }
  }
}

function createPollen(count = 60, fadeIn = false) {
  for (let i = 0; i < count; i += 1) {
    const p = createParticle('pollen');
    if (p) {
      if (fadeIn) {
        p.fadingIn = true;
        p.opacity = 0;
      }
      particles.push(p);
    }
  }
}

function getTargetCount() {
  const base = particleMode === 'star' ? 180 : 60;
  return Math.floor(base * particleMultiplier);
}

function repopulate(mode, fadeIn = false) {
  particles.forEach(releaseParticle);
  particles = [];
  if (mode === 'star') {
    createStars(getTargetCount(), fadeIn);
  } else {
    createPollen(getTargetCount(), fadeIn);
  }
}

function drawParticle(particle) {
  const cx = cursor.x - window.innerWidth / 2;
  const cy = cursor.y - window.innerHeight / 2;

  let parallaxFactor = 0.02;
  if (particle.type === 'star') {
    parallaxFactor = particle.size > 1.2 ? 0.08 : 0.02;
  }
  if (particle.type === 'pollen') {
    parallaxFactor = 0.05;
  }

  const drawX = particle.x + cx * parallaxFactor;
  const drawY = particle.y + cy * parallaxFactor;

  particleCtx.globalAlpha = Math.max(0, Math.min(1, particle.opacity));

  if (particle.type === 'star') {
    particleCtx.fillStyle = '#ffffff';
    particleCtx.beginPath();
    particleCtx.arc(drawX, drawY, particle.size, 0, Math.PI * 2);
    particleCtx.fill();
  } else {
    particleCtx.fillStyle = 'rgba(212,134,42,0.8)';
    particleCtx.beginPath();
    particleCtx.ellipse(drawX, drawY, particle.size * 1.1, particle.size * 0.7, 0.7, 0, Math.PI * 2);
    particleCtx.fill();
  }
}

function updateParticle(particle, deltaTime) {
  const drift = particle.type === 'star' ? 0.015 : 0.03;
  const brownian = (Math.random() - 0.5) * 0.04;

  particle.x += (particle.vx + brownian + drift) * (deltaTime * 60);
  particle.y += (particle.vy + brownian) * (deltaTime * 60);

  if (particle.type === 'pollen') {
    particle.vy += 0.005 * deltaTime * 60;
  }

  if (particle.x < -10) particle.x = particleCanvas.width + 10;
  if (particle.x > particleCanvas.width + 10) particle.x = -10;
  if (particle.y < -10) particle.y = particleCanvas.height + 10;
  if (particle.y > particleCanvas.height + 10) particle.y = -10;

  if (transition) {
    const now = performance.now();
    const elapsed = now - transition.startedAt;
    const ratio = Math.min(1, elapsed / 800);

    if (transition.mode === 'out') {
      particle.opacity = particle.targetOpacity * (1 - ratio);
      if (ratio >= 1) {
        releaseParticle(particle);
        return false;
      }
    }

    if (transition.mode === 'in' && particle.fadingIn) {
      particle.opacity = particle.targetOpacity * ratio;
      if (ratio >= 1) {
        particle.fadingIn = false;
      }
    }
  }

  return true;
}

function renderParticles(deltaTime) {
  if (!particleCtx || !particleCanvas) {
    return;
  }

  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

  particles = particles.filter((particle) => {
    const alive = updateParticle(particle, deltaTime);
    if (alive) {
      drawParticle(particle);
    }
    return alive;
  });

  particleCtx.globalAlpha = 1;
}

function renderGrain() {
  if (!grainCtx || !grainCanvas) {
    return;
  }

  const width = grainCanvas.width;
  const height = grainCanvas.height;
  const image = grainCtx.createImageData(width, height);
  const alpha = worldState === 'night' ? 8 : 5;

  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.random() * 255;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = alpha;
  }

  grainCtx.putImageData(image, 0, 0);
}

function resetGrainInterval() {
  if (grainTimer) {
    clearInterval(grainTimer);
  }
  grainTimer = setInterval(renderGrain, grainIntervalMs);
}

function checkPerformance() {
  const avg = fpsHistory.reduce((acc, v) => acc + v, 0) / Math.max(1, fpsHistory.length);

  if (!lowPerformance && avg < 30) {
    lowPerformance = true;
    particles = particles.filter((_, index) => index % 2 === 0);
    grainIntervalMs = 160;
    resetGrainInterval();
  } else if (lowPerformance && avg > 45) {
    lowPerformance = false;
    grainIntervalMs = 80;
    resetGrainInterval();
    repopulate(particleMode);
  }
}

function transitionParticles() {
  transition = { startedAt: performance.now(), mode: 'out' };
  const targetMode = particleMode === 'star' ? 'pollen' : 'star';

  window.setTimeout(() => {
    particles.forEach(releaseParticle);
    particles = [];
    particleMode = targetMode;
    transition = { startedAt: performance.now(), mode: 'in' };

    if (particleMode === 'star') {
      createStars(getTargetCount(), true);
    } else {
      createPollen(getTargetCount(), true);
    }

    window.setTimeout(() => {
      transition = null;
    }, 800);
  }, 30);
}

function onFlipMidpoint() {
  if (!sceneEl) {
    return;
  }

  const toDawn = worldState === 'night';
  worldState = toDawn ? 'dawn' : 'night';
  sceneEl.classList.toggle('is-dawn', toDawn);
  sceneEl.classList.toggle('is-night', !toDawn);
  transitionParticles();
}

function onMouseMove(event) {
  const now = performance.now();
  if (now - lastMouseMove < 16) {
    return;
  }
  lastMouseMove = now;
  cursor.x = Number.isFinite(event.clientX) ? event.clientX : 0;
  cursor.y = Number.isFinite(event.clientY) ? event.clientY : 0;
}

function onResize() {
  if (particleCanvas) {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
  }
  if (grainCanvas) {
    grainCanvas.width = window.innerWidth;
    grainCanvas.height = window.innerHeight;
  }
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function initScene() {
  sceneEl = document.querySelector('.scene');
  particleCanvas = document.querySelector('.world-particles');
  grainCanvas = document.querySelector('.world-grain');

  if (!sceneEl || !particleCanvas || !grainCanvas) {
    return;
  }

  particleCtx = particleCanvas.getContext('2d');
  grainCtx = grainCanvas.getContext('2d');

  setupPool();
  setupCanvas(particleCanvas, particleCtx);
  setupCanvas(grainCanvas, grainCtx);

  repopulate('star');
  resetGrainInterval();

  document.addEventListener('flip:midpoint', onFlipMidpoint);
  document.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('resize', debounce(onResize, 250));
}

export function updateScene(deltaTime) {
  if (!particleCtx) {
    return;
  }

  renderParticles(deltaTime);

  const fps = 1 / Math.max(0.001, deltaTime);
  fpsHistory.push(fps);
  if (fpsHistory.length > 120) {
    fpsHistory.shift();
  }

  perfTimer += deltaTime * 1000;
  if (perfTimer > 2000) {
    perfTimer = 0;
    checkPerformance();
  }

  const cardRect = document.querySelector('.card')?.getBoundingClientRect();
  if (cardRect) {
    sceneEl.style.setProperty('--halo-x', `${cardRect.left + cardRect.width / 2}px`);
    sceneEl.style.setProperty('--halo-y', `${cardRect.top + cardRect.height / 2}px`);
  }
}

export function getWorldState() {
  return worldState;
}

export function setParticleMultiplier(multiplier) {
  particleMultiplier = Math.max(0.2, Math.min(1, multiplier));
  repopulate(particleMode);
}

export function isLowPerformance() {
  return lowPerformance;
}

