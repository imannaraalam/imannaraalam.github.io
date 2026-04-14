/* Interactions module: orchestrates discovery tiers, easter eggs and micro animations. */

import { flipCard, setTiltBias } from './card.js';

let scene;
let card;
let cardWrapper;
let hint;

let idleTimer;
let hintTimer;
let wheelThrottle = 0;
let zoomLevel = 1;

let konamiCooldownUntil = 0;
let confettiCooldownUntil = 0;
let shakeCooldownUntil = 0;

const konamiTarget = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
const konamiBuffer = [];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function showHint() {
  if (!hint) {
    return;
  }
  hint.hidden = false;
}

function hideHint() {
  if (!hint) {
    return;
  }
  hint.hidden = true;
}

function resetIdleTimers() {
  window.clearTimeout(idleTimer);
  window.clearTimeout(hintTimer);

  hintTimer = window.setTimeout(showHint, 5000);
  idleTimer = window.setTimeout(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    card.classList.add('idle-showcase');
    card.style.transition = 'transform 12s linear';
    card.style.transform += ' rotateY(720deg)';
  }, 15000);
}

function initTyping() {
  const nameEl = document.querySelector('.front-name');
  if (!nameEl) {
    return;
  }

  const text = nameEl.getAttribute('data-text') || '';
  nameEl.textContent = '';

  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  cursor.textContent = '|';
  nameEl.appendChild(cursor);

  let index = 0;
  const tick = () => {
    if (index < text.length) {
      nameEl.insertBefore(document.createTextNode(text[index]), cursor);
      index += 1;
      window.setTimeout(tick, 60);
    } else {
      window.setTimeout(() => {
        cursor.remove();
      }, 1500);
    }
  };

  tick();
}

function initTraces() {
  const paths = document.querySelectorAll('.front-traces path');
  paths.forEach((path, index) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    window.setTimeout(() => {
      path.style.transition = 'stroke-dashoffset 1.2s ease-out';
      path.style.strokeDashoffset = '0';
    }, index * 300);
  });
}

function initGlitchScheduler() {
  const run = () => {
    const spans = [...document.querySelectorAll('.front-metadata span')];
    if (spans.length > 0) {
      const target = spans[Math.floor(Math.random() * spans.length)];
      target.classList.add('glitching');
      window.setTimeout(() => target.classList.remove('glitching'), 400);
    }
    window.setTimeout(run, 18000 + Math.random() * 4000);
  };

  window.setTimeout(run, 18000);
}

function initBackStagger() {
  const children = document.querySelectorAll('.card-back > *');
  children.forEach((el, index) => {
    el.classList.add('back-hidden');
    el.classList.remove('back-reveal');

    window.setTimeout(() => {
      el.classList.remove('back-hidden');
      el.classList.add('back-reveal');
    }, index * 150);
  });
}

function initHobbies() {
  document.querySelectorAll('.hobby').forEach((button) => {
    button.addEventListener('mouseenter', () => {
      const hobby = button.getAttribute('data-hobby');
      if (!hobby) return;

      if (hobby === 'music') {
        for (let i = 0; i < 3; i += 1) {
          const note = document.createElement('span');
          note.textContent = '♪';
          note.style.position = 'absolute';
          note.style.left = `${i * 8}px`;
          note.style.top = '-4px';
          note.style.animation = 'confetti-fall 1s ease-out forwards';
          button.appendChild(note);
          window.setTimeout(() => note.remove(), 1000);
        }
        document.dispatchEvent(new CustomEvent('sound:musicNote'));
      }

      if (hobby === 'travel') {
        button.animate([
          { transform: 'translate(0,0) rotate(0deg)' },
          { transform: 'translate(20px,-10px) rotate(-15deg)' }
        ], { duration: 600, easing: 'ease-out' });
        document.dispatchEvent(new CustomEvent('sound:swoosh'));
      }

      if (hobby === 'photo') {
        const back = document.querySelector('.card-back');
        if (back) {
          back.style.boxShadow = '0 0 0 9999px rgba(255,255,255,0.8) inset';
          window.setTimeout(() => {
            back.style.boxShadow = '';
          }, 80);
        }
        document.dispatchEvent(new CustomEvent('sound:shutter'));
      }

      if (hobby === 'nature') {
        button.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.5)' },
          { transform: 'scale(1)' }
        ], { duration: 400, easing: 'ease-out' });
      }

      if (hobby === 'sport') {
        button.animate([
          { transform: 'translateY(0)' },
          { transform: 'translateY(-4px)' },
          { transform: 'translateY(0)' }
        ], { duration: 300, easing: 'ease-out' });
      }
    });
  });
}

function initFlipTrigger() {
  card.addEventListener('dblclick', (event) => {
    const rect = card.getBoundingClientRect();
    const isEdge = event.clientX - rect.left < 40 || rect.right - event.clientX < 40;
    if (isEdge) {
      flipCard();
    }
  });
}

function initMagneticHover() {
  card.addEventListener('mousemove', (event) => {
    const rect = card.getBoundingClientRect();
    const topDist = event.clientY - rect.top;
    const bottomDist = rect.bottom - event.clientY;
    const nearTop = topDist < 30;
    const nearBottom = bottomDist < 30;

    if (nearTop || nearBottom) {
      const bias = nearTop ? -5 : 5;
      setTiltBias(bias, 0);
    } else {
      setTiltBias(0, 0);
    }
  });
}

function spawnConfetti() {
  const colors = ['#2979ff', '#00e5ff', '#c4622d', '#5a7a52', '#d4862a'];
  for (let i = 0; i < 30; i += 1) {
    const dot = document.createElement('div');
    dot.className = 'confetti';
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.top = `${20 + Math.random() * 20}%`;
    dot.style.background = colors[Math.floor(Math.random() * colors.length)];
    scene.appendChild(dot);
    window.setTimeout(() => dot.remove(), 1600);
  }
}

function initTripleClick() {
  const stamps = [];

  document.querySelectorAll('.front-name, .back-name').forEach((el) => {
    el.addEventListener('click', () => {
      const now = performance.now();
      stamps.push(now);
      while (stamps.length && now - stamps[0] > 500) {
        stamps.shift();
      }

      if (stamps.length >= 3 && now > confettiCooldownUntil) {
        confettiCooldownUntil = now + 2000;
        stamps.length = 0;
        spawnConfetti();
        document.dispatchEvent(new CustomEvent('sound:confetti'));
      }
    });
  });
}

function initShakeDetection() {
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  let streak = 0;

  document.addEventListener('mousemove', (event) => {
    const now = performance.now();
    if (!lastT) {
      lastX = event.clientX;
      lastY = event.clientY;
      lastT = now;
      return;
    }

    const dt = (now - lastT) / 1000;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    const speed = Math.sqrt(dx * dx + dy * dy) / Math.max(0.001, dt);

    if (speed > 2000) {
      streak += 1;
    } else {
      streak = 0;
    }

    if (streak >= 3 && now > shakeCooldownUntil) {
      shakeCooldownUntil = now + 1000;
      streak = 0;
      card.classList.add('shaking');
      document.dispatchEvent(new CustomEvent('sound:glitch'));
      window.setTimeout(() => card.classList.remove('shaking'), 600);
    }

    lastX = event.clientX;
    lastY = event.clientY;
    lastT = now;
  }, { passive: true });
}

function initLongPress() {
  let timer;

  card.addEventListener('pointerdown', () => {
    timer = window.setTimeout(() => {
      card.classList.add('corner-fold');
      window.setTimeout(() => card.classList.remove('corner-fold'), 2000);
    }, 1500);
  });

  card.addEventListener('pointerup', () => {
    window.clearTimeout(timer);
  });
}

function initWheelZoom() {
  scene.addEventListener('wheel', (event) => {
    event.preventDefault();

    const now = performance.now();
    if (now - wheelThrottle < 100) {
      return;
    }
    wheelThrottle = now;

    if (event.deltaY > 0) {
      zoomLevel = Math.max(0.6, zoomLevel - 0.02);
    } else {
      zoomLevel = Math.min(1, zoomLevel + 0.02);
    }

    const eased = lerp(parseFloat(cardWrapper.style.getPropertyValue('--wrapper-scale') || '1'), zoomLevel, 0.3);
    cardWrapper.style.setProperty('--wrapper-scale', String(eased));
  }, { passive: false });
}

function initKonami() {
  document.addEventListener('keydown', (event) => {
    konamiBuffer.push(event.code);
    if (konamiBuffer.length > 10) {
      konamiBuffer.shift();
    }

    if (konamiBuffer.join(',') === konamiTarget.join(',') && performance.now() > konamiCooldownUntil) {
      konamiCooldownUntil = performance.now() + 3000;
      card.classList.add('pixel-mode');
      document.dispatchEvent(new CustomEvent('sound:konami'));
      window.setTimeout(() => card.classList.remove('pixel-mode'), 3000);
    }
  });
}

function initKeyboard() {
  card.addEventListener('keydown', (event) => {
    if (event.code === 'Enter' || event.code === 'Space') {
      event.preventDefault();
      flipCard();
    }

    if (event.code === 'Escape') {
      hideHint();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      hideHint();
    }
  });
}

function initCoffeeAndLed() {
  const coffee = document.querySelector('.back-coffee');
  if (coffee) {
    coffee.addEventListener('click', () => {
      coffee.classList.add('expanding');
      document.dispatchEvent(new CustomEvent('sound:coffee'));
      window.setTimeout(() => coffee.classList.remove('expanding'), 1000);
    });
  }

  document.querySelectorAll('.led').forEach((led) => {
    led.addEventListener('click', () => {
      led.classList.toggle('is-off');
      led.style.animation = led.classList.contains('is-off') ? 'none' : '';
      led.setAttribute('aria-pressed', led.classList.contains('is-off') ? 'true' : 'false');
      document.dispatchEvent(new CustomEvent('sound:ledClick'));
    });
  });
}

function initScrollCard() {
  card.addEventListener('wheel', (event) => {
    const back = document.querySelector('.card-back');
    if (!back) return;

    if (back.scrollHeight > back.clientHeight) {
      back.scrollTop += event.deltaY;
      event.stopPropagation();
      event.preventDefault();
    }
  }, { passive: false });
}

export function initInteractions() {
  scene = document.querySelector('.scene');
  card = document.querySelector('.card');
  cardWrapper = document.querySelector('.card-wrapper');
  hint = document.querySelector('.flip-hint');

  if (!scene || !card || !cardWrapper) {
    return;
  }

  initTyping();
  initTraces();
  initGlitchScheduler();
  initHobbies();
  initFlipTrigger();
  initMagneticHover();
  initTripleClick();
  initShakeDetection();
  initLongPress();
  initWheelZoom();
  initKonami();
  initKeyboard();
  initCoffeeAndLed();
  initScrollCard();

  document.addEventListener('flip:end', (event) => {
    if (event.detail.face === 'back') {
      initBackStagger();
    }
    if (event.detail.face === 'front') {
      initTyping();
    }
  });

  ['mousemove', 'click', 'keydown'].forEach((eventName) => {
    document.addEventListener(eventName, () => {
      resetIdleTimers();
      hideHint();
      card.classList.remove('idle-showcase');
      card.style.transition = '';
    }, { passive: true });
  });

  resetIdleTimers();
}

