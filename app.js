const pageNames = { home: 'Portfolio', works: 'My works', social: 'Social', about: 'About me' };
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let navigationTimer;

function route(animate = false) {
  const requested = location.hash.slice(1) || 'home';
  const current = Object.hasOwn(pageNames, requested) ? requested : 'home';
  if (requested !== current) history.replaceState(null, '', '#home');

  document.querySelectorAll('main > section').forEach(section => {
    section.classList.remove('is-leaving', 'is-entering');
    section.hidden = section.id !== current;
  });

  const activeSection = document.getElementById(current);
  if (animate && !reduceMotion.matches) {
    activeSection.classList.add('is-entering');
    requestAnimationFrame(() => requestAnimationFrame(() => activeSection.classList.remove('is-entering')));
  }

  document.title = `${pageNames[current]} — Mengele Maxim`;
  window.scrollTo(0, 0);
  document.querySelectorAll('.art-card.is-zoomed').forEach(card => card.classList.remove('is-zoomed'));
}

const touchCards = window.matchMedia('(hover: none), (pointer: coarse)');

function createPageSlide(section) {
  document.querySelector('.page-slide-clone')?.remove();

  const clone = section.cloneNode(true);
  clone.removeAttribute('id');
  clone.removeAttribute('hidden');
  clone.setAttribute('aria-hidden', 'true');
  clone.classList.remove('is-leaving', 'is-entering');
  clone.classList.add('page-slide-clone');
  clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
  clone.querySelectorAll('audio').forEach(element => element.remove());
  document.body.append(clone);

  requestAnimationFrame(() => requestAnimationFrame(() => clone.classList.add('is-running')));
  window.setTimeout(() => clone.remove(), 460);
}

document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || !link.hash || link.hash === location.hash) return;

  event.preventDefault();
  const activeSection = document.querySelector('main > section:not([hidden])');
  const delay = 0;
  if (activeSection && !reduceMotion.matches) createPageSlide(activeSection);
  activeSection?.classList.add('is-leaving');
  clearTimeout(navigationTimer);
  navigationTimer = setTimeout(() => {
    location.hash = link.hash;
  }, delay);
});

document.addEventListener('click', event => {
  if (!touchCards.matches && window.innerWidth > 600) return;

  const selectedCard = event.target.closest('.art-card');
  document.querySelectorAll('.art-card.is-zoomed').forEach(card => {
    if (card !== selectedCard) card.classList.remove('is-zoomed');
  });

  if (selectedCard) selectedCard.classList.toggle('is-zoomed');
});

async function runPreloader() {
  const preloader = document.getElementById('preloader');
  const previewMode = new URLSearchParams(location.search).has('loader-preview');
  let alreadyShown = false;

  if (!previewMode) {
    try {
      alreadyShown = sessionStorage.getItem('portfolio-preloader-shown') === '1';
    } catch {}
  }

  if (alreadyShown) {
    preloader.remove();
    return;
  }

  const assetPaths = [
    'assets/loading-bg.webp',
    'assets/loading-star.png',
    'assets/home-bg.webp',
    'assets/works-bg.webp',
    'assets/social-bg.webp',
    'assets/about-bg.webp',
    'assets/card-1.png',
    'assets/card-2.png',
    'assets/card-3.png',
    'assets/card-4.png',
    'assets/card-5.png'
  ];

  const loading = assetPaths.map(path => new Promise(resolve => {
    const image = new Image();
    const done = () => {
      resolve();
    };
    image.onload = done;
    image.onerror = done;
    image.src = path;
  }));

  const minimumTime = previewMode ? 15000 : (reduceMotion.matches ? 0 : 1200);
  await Promise.all([Promise.allSettled(loading), new Promise(resolve => setTimeout(resolve, minimumTime))]);

  if (!previewMode) {
    try {
      sessionStorage.setItem('portfolio-preloader-shown', '1');
    } catch {}
  }

  setTimeout(() => {
    preloader.classList.add('is-hidden');
    preloader.setAttribute('aria-hidden', 'true');
  }, reduceMotion.matches ? 0 : 180);
  setTimeout(() => preloader.remove(), reduceMotion.matches ? 0 : 900);
}

window.addEventListener('hashchange', () => route(true));
route(false);
runPreloader();

const siteAudio = document.getElementById('site-audio');
const volumeSlider = document.getElementById('volume-slider');
let audioContext;
let gainNode;
let mediaSource;

function currentVolume() {
  return Number(volumeSlider.value) / 100;
}

function ensureAudioGraph() {
  if (audioContext) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioContext = new AudioContextClass();
  mediaSource = audioContext.createMediaElementSource(siteAudio);
  gainNode = audioContext.createGain();
  gainNode.gain.value = currentVolume();
  mediaSource.connect(gainNode).connect(audioContext.destination);
  siteAudio.volume = 1;
}

function setVolume() {
  const volume = currentVolume();
  if (gainNode && audioContext) {
    gainNode.gain.setTargetAtTime(volume, audioContext.currentTime, .015);
  } else {
    siteAudio.volume = volume;
  }
}

async function startMusic(fromUserGesture = false) {
  if (fromUserGesture) {
    ensureAudioGraph();
    if (audioContext?.state === 'suspended') {
      try { await audioContext.resume(); } catch {}
    }
  }

  setVolume();
  try {
    await siteAudio.play();
    document.documentElement.classList.add('music-playing');
  } catch {
    document.documentElement.classList.remove('music-playing');
  }
}

volumeSlider.addEventListener('input', () => {
  setVolume();
  if (siteAudio.paused) startMusic(true);
});

const unlockMusic = () => startMusic(true);
document.addEventListener('pointerdown', unlockMusic, { once: true, passive: true });
document.addEventListener('touchstart', unlockMusic, { once: true, passive: true });
document.addEventListener('keydown', unlockMusic, { once: true });
startMusic(false);
