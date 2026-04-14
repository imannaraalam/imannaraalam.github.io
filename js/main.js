import { initScene } from './scene.js';
import { initCard } from './card.js';
import { initInteractions } from './interactions.js';
import { initAudio } from './audio.js';

function boot() {
  initScene();
  initCard();
  initInteractions();
  initAudio();

  const hint = document.querySelector('.landscape-hint');
  if (hint && window.innerWidth < 600 && window.innerHeight > window.innerWidth) {
    hint.hidden = false;
    window.setTimeout(() => {
      hint.hidden = true;
    }, 4000);
  }
}

document.addEventListener('DOMContentLoaded', boot);

