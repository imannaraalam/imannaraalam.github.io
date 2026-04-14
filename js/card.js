/* Card module: 3D card physics, flip lifecycle, drag, swipe and device tilt. */

import { updateScene, getWorldState, setParticleMultiplier } from './scene.js';

let scene;
let cardWrapper;
let card;

let currentRotX = 0;
let currentRotY = 0;
let currentRotZ = 0;
let floatY = 0;
let targetTiltX = 0;
let targetTiltY = 0;
let tiltBiasX = 0;
let tiltBiasY = 0;

let idleRotX = 0;
let idleRotY = 0;
let idleRotZ = 0;

let isFlipping = false;
let isFlipped = false;
let isDragging = false;
let reducedMotion = false;

let lastTime = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragStartX = 0;
let dragStartY = 0;

let flipFromDeg = 0;
let flipToDeg = 0;
let flipStart = 0;
let flipCurrent = 0;
let midpointDone = false;

let lastMoveUpdate = 0;
let maxTiltX = 18;
let maxTiltY = 22;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function updateFloat(now) {
  if (reducedMotion) {
    floatY = 0;
    idleRotX = 0;
    idleRotY = 0;
    idleRotZ = 0;
    return;
  }

  const t = now / 1000;
  floatY = Math.sin(t * (2 * Math.PI / 3.2)) * 10;
  idleRotX = Math.sin(t * 0.7) * 2.5;
  idleRotY = Math.sin(t * 0.5) * 1.8;
  idleRotZ = Math.sin(t * 0.3) * 0.4;
}

function updateTilt() {
  currentRotX = lerp(currentRotX, targetTiltX + tiltBiasX + idleRotX, 0.08);
  currentRotY = lerp(currentRotY, targetTiltY + tiltBiasY + idleRotY, 0.08);
  currentRotZ = lerp(currentRotZ, idleRotZ, 0.08);
}

function updateFlip(now) {
  if (!isFlipping) {
    flipCurrent = isFlipped ? 180 : 0;
    return;
  }

  const duration = reducedMotion ? 1 : 2000;
  const elapsed = now - flipStart;
  const t = clamp(elapsed / duration, 0, 1);
  flipCurrent = lerp(flipFromDeg, flipToDeg, easeInOut(t));

  if (!midpointDone && elapsed >= duration / 2) {
    midpointDone = true;
    document.dispatchEvent(new CustomEvent('flip:midpoint'));
  }

  if (t >= 1) {
    isFlipping = false;
    isFlipped = !isFlipped;
    card.style.transition = '';
    card.setAttribute('aria-pressed', isFlipped ? 'true' : 'false');
    document.dispatchEvent(new CustomEvent('flip:end', { detail: { face: isFlipped ? 'back' : 'front' } }));
    document.dispatchEvent(new CustomEvent('sound:flipLand'));
  }
}

function applyTransform() {
  const transform = `translateX(${dragOffsetX}px) translateY(${dragOffsetY + floatY}px) rotateX(${currentRotX}deg) rotateY(${currentRotY + flipCurrent}deg) rotateZ(${currentRotZ}deg)`;
  card.style.transform = transform;

  card.style.setProperty('--spec-x', `${50 + currentRotY * 1.5}%`);
  card.style.setProperty('--spec-y', `${50 - currentRotX * 1.5}%`);
  card.style.setProperty('--spec-opacity', `${Math.min(0.15, (Math.abs(currentRotX) + Math.abs(currentRotY)) * 0.003)}`);

  const shadowX = -currentRotY * 1.2;
  const shadowY = 20 + currentRotX * 0.8;
  const shadowBlur = 40 + Math.abs(floatY) * 4;
  const lift = Math.max(0.8, 1 + floatY / 20);

  if (getWorldState() === 'night') {
    card.style.boxShadow = `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0,0,0,${0.7 * lift}), 0 0 80px rgba(41,121,255,0.12), 0 0 0 1px rgba(0,140,255,0.15)`;
  } else {
    card.style.boxShadow = `${shadowX}px ${shadowY}px ${shadowBlur * 0.8}px rgba(120,80,30,${0.25 * lift}), 0 0 60px rgba(212,134,42,0.1), 0 0 0 1px rgba(196,98,45,0.2)`;
  }

  const showThickness = Math.abs(currentRotY) > 10;
  card.classList.toggle('show-thickness', showThickness && !isFlipped);
  card.classList.toggle('show-thickness-back', showThickness && isFlipped);
}

function animate(now) {
  if (!lastTime) {
    lastTime = now;
  }

  const deltaTime = (now - lastTime) / 1000;
  lastTime = now;

  updateFloat(now);
  updateTilt();
  updateFlip(now);
  applyTransform();
  updateScene(deltaTime);

  requestAnimationFrame(animate);
}

function onMouseMove(event) {
  const now = performance.now();
  if (now - lastMoveUpdate < 16 || reducedMotion) {
    return;
  }
  lastMoveUpdate = now;

  const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
  const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;

  targetTiltX = clamp(normalizedY * -maxTiltX, -maxTiltX, maxTiltX);
  targetTiltY = clamp(normalizedX * maxTiltY, -maxTiltY, maxTiltY);
}

function onPointerDown(event) {
  if (window.innerWidth < 600) {
    return;
  }

  const rect = card.getBoundingClientRect();
  const edge = event.clientX - rect.left < 40 || rect.right - event.clientX < 40;
  if (edge) {
    return;
  }

  isDragging = true;
  card.classList.add('dragging');
  card.setPointerCapture(event.pointerId);
  dragStartX = event.clientX - dragOffsetX;
  dragStartY = event.clientY - dragOffsetY;
}

function onPointerMove(event) {
  if (!isDragging) {
    return;
  }
  dragOffsetX = event.clientX - dragStartX;
  dragOffsetY = event.clientY - dragStartY;
}

function onPointerUp(event) {
  if (!isDragging) {
    return;
  }

  isDragging = false;
  card.classList.remove('dragging');
  card.releasePointerCapture(event.pointerId);

  const springBack = () => {
    dragOffsetX = lerp(dragOffsetX, 0, 0.06);
    dragOffsetY = lerp(dragOffsetY, 0, 0.06);
    if (Math.abs(dragOffsetX) + Math.abs(dragOffsetY) > 0.5) {
      requestAnimationFrame(springBack);
    }
  };

  requestAnimationFrame(springBack);
}

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

function onTouchStart(event) {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = performance.now();
}

function onTouchEnd(event) {
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const deltaTime = performance.now() - touchStartTime;

  if (Math.abs(deltaX) > 80 && deltaTime < 300 && Math.abs(deltaX) > Math.abs(deltaY) * 1.7) {
    flipCard();
  }
}

function initGyroscope() {
  if (!('DeviceOrientationEvent' in window) || window.innerWidth >= 600) {
    return;
  }

  const bind = () => {
    window.addEventListener('deviceorientation', (event) => {
      if (typeof event.gamma !== 'number' || typeof event.beta !== 'number') {
        return;
      }
      targetTiltY = clamp((event.gamma / 90) * 15, -15, 15);
      targetTiltX = clamp((-event.beta / 90) * 12, -12, 12);
    });
  };

  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then((state) => {
      if (state === 'granted') {
        bind();
      }
    }).catch(() => {
      // Ignore denied permission.
    });
  } else {
    bind();
  }
}

function updateResponsiveState() {
  if (window.innerWidth < 600) {
    maxTiltX = 10;
    maxTiltY = 10;
    setParticleMultiplier(0.5);
  } else if (window.innerWidth <= 900) {
    maxTiltX = 10;
    maxTiltY = 10;
    setParticleMultiplier(1);
  } else {
    maxTiltX = 18;
    maxTiltY = 22;
    setParticleMultiplier(1);
  }
}

export function flipCard() {
  if (isFlipping) {
    return;
  }

  isFlipping = true;
  midpointDone = false;
  flipStart = performance.now();
  flipFromDeg = isFlipped ? 180 : 0;
  flipToDeg = isFlipped ? 0 : 180;

  card.style.transition = 'transform var(--flip-duration) var(--flip-easing)';

  document.dispatchEvent(new CustomEvent('flip:start', { detail: { from: isFlipped ? 'dawn' : 'night' } }));
  document.dispatchEvent(new CustomEvent('sound:flipStart'));
}

export function isCardFlipped() {
  return isFlipped;
}

export function setTiltBias(x, y) {
  tiltBiasX = clamp(x, -5, 5);
  tiltBiasY = clamp(y, -5, 5);
}

export function initCard() {
  scene = document.querySelector('.scene');
  cardWrapper = document.querySelector('.card-wrapper');
  card = document.querySelector('.card');

  if (!scene || !cardWrapper || !card) {
    return;
  }

  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('mousemove', onMouseMove, { passive: true });
  card.addEventListener('pointerdown', onPointerDown);
  card.addEventListener('pointermove', onPointerMove);
  card.addEventListener('pointerup', onPointerUp);

  if ('ontouchstart' in window) {
    card.addEventListener('touchstart', onTouchStart, { passive: true });
    card.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  window.addEventListener('resize', updateResponsiveState);
  updateResponsiveState();
  initGyroscope();

  requestAnimationFrame(animate);
}

