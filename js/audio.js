/* Audio module: opt-in consent, synthesis engine, event bus and keyboard toggle. */

let audioCtx = null;
let masterGain = null;
let soundEnabled = false;

const sounds = {};

function createNoiseBuffer(ctx, duration = 0.2) {
  const frameCount = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function connectNode(node) {
  node.connect(masterGain);
  return node;
}

function initSynthSounds(ctx) {
  sounds.S1 = () => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.connect(gain);
    connectNode(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  };

  sounds.S2 = () => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.5);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 2;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    osc.connect(gain);
    connectNode(gain);

    noise.start();
    noise.stop(ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  sounds.S3 = () => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.connect(gain);
    connectNode(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  sounds.S4 = () => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 2000;
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
    osc.connect(gain);
    connectNode(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  };

  sounds.S5 = () => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 523;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain);
    connectNode(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  sounds.S6 = () => {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx, 0.3);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(4000, ctx.currentTime + 0.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    source.connect(filter);
    filter.connect(gain);
    connectNode(gain);
    source.start();
    source.stop(ctx.currentTime + 0.3);
  };

  sounds.S7 = () => {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx, 0.03);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
    source.connect(gain);
    connectNode(gain);
    source.start();
    source.stop(ctx.currentTime + 0.03);
  };

  sounds.S8 = () => {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx, 0.6);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    source.connect(filter);
    filter.connect(gain);
    connectNode(gain);
    source.start();
    source.stop(ctx.currentTime + 0.6);
  };

  sounds.S9 = () => {
    [523, 659, 784].forEach((freq, index) => {
      const start = ctx.currentTime + index * 0.15;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.1);
      osc.connect(gain);
      connectNode(gain);
      osc.start(start);
      osc.stop(start + 0.1);
    });
  };

  sounds.S10 = () => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.connect(gain);
    connectNode(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  };

  sounds.S11 = () => {};

  sounds.S12 = () => {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx, 0.1);
    const shaper = ctx.createWaveShaper();
    shaper.curve = new Float32Array(Array.from({ length: 128 }, (_, i) => {
      const x = (i * 2) / 127 - 1;
      return Math.tanh(3 * x);
    }));
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);

    source.connect(shaper);
    shaper.connect(gain);
    connectNode(gain);
    source.start();
    source.stop(ctx.currentTime + 0.1);
  };
}

function bindAudioBus() {
  const map = {
    'sound:tick': 'S1',
    'sound:flipStart': 'S2',
    'sound:flipLand': 'S3',
    'sound:ledClick': 'S4',
    'sound:musicNote': 'S5',
    'sound:swoosh': 'S6',
    'sound:shutter': 'S7',
    'sound:coffee': 'S8',
    'sound:konami': 'S9',
    'sound:confetti': 'S10',
    'sound:ambient': 'S11',
    'sound:glitch': 'S12'
  };

  Object.entries(map).forEach(([eventName, soundId]) => {
    document.addEventListener(eventName, () => {
      if (!soundEnabled || !sounds[soundId]) {
        return;
      }
      sounds[soundId]();
    });
  });

  document.addEventListener('flip:start', () => {
    if (!masterGain) return;
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.08);
    sounds.S2?.();
  });

  document.addEventListener('flip:midpoint', () => {
    sounds.S11?.();
  });

  document.addEventListener('flip:end', () => {
    sounds.S3?.();
    if (!masterGain) return;
    masterGain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.3);
  });
}

async function enableAudio() {
  if (audioCtx) {
    soundEnabled = true;
    masterGain.gain.value = 0.35;
    return;
  }

  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(audioCtx.destination);
    await audioCtx.resume();

    initSynthSounds(audioCtx);
    bindAudioBus();
    soundEnabled = true;
  } catch (error) {
    console.error('Audio init failed:', error);
  }
}

function hideToast(toast) {
  toast.hidden = true;
}

function setupToast() {
  const toast = document.querySelector('.audio-toast');
  if (!toast) {
    return;
  }

  const yes = toast.querySelector('.yes');
  const no = toast.querySelector('.no');

  yes?.addEventListener('click', async () => {
    localStorage.setItem('soundEnabled', 'true');
    await enableAudio();
    hideToast(toast);
  });

  no?.addEventListener('click', () => {
    soundEnabled = false;
    localStorage.setItem('soundEnabled', 'false');
    hideToast(toast);
  });

  document.addEventListener('click', () => {
    if (localStorage.getItem('soundEnabled') === null) {
      toast.hidden = false;
    }
  }, { once: true });
}

function setupKeyboardToggle() {
  document.addEventListener('keydown', async (event) => {
    if (event.code !== 'KeyA') {
      return;
    }

    if (!audioCtx) {
      await enableAudio();
    }

    soundEnabled = !soundEnabled;
    if (masterGain) {
      masterGain.gain.value = soundEnabled ? 0.35 : 0;
    }
    localStorage.setItem('soundEnabled', soundEnabled ? 'true' : 'false');
  });
}

export function initAudio() {
  const persisted = localStorage.getItem('soundEnabled');

  setupToast();
  setupKeyboardToggle();

  if (persisted === 'true') {
    enableAudio();
  }

  if (persisted === 'false') {
    soundEnabled = false;
  }
}

