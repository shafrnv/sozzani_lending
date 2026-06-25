const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const END_HOLD_RATIO = 0.28;
const panSections = Array.from(document.querySelectorAll('[data-pan]')).map((section) => ({
  section,
  stage: section.querySelector('.pin-pan__stage'),
  moving: section.querySelector('.pan-moving'),
  maxTranslate: 0,
  endHold: 0,
  start: 0,
  targetProgress: 0,
  currentProgress: 0,
}));
const langPanels = Array.from(document.querySelectorAll('[data-lang-toggle]'));

function initLanguageToggles() {
  langPanels.forEach((panel) => {
    const toggle = () => panel.classList.toggle('is-en');
    panel.addEventListener('click', toggle);
    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  });
}

function initLazyImages() {
  document.querySelectorAll('img').forEach((img) => {
    const inHero = img.closest('[aria-label="Group 0"], [aria-label="Group 1"]');
    if (inHero) return;
    img.loading = 'lazy';
    img.decoding = 'async';
  });
}

function markImageRatios() {
  document.querySelectorAll('img').forEach((img) => {
    const setRatio = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      img.style.setProperty('--img-ratio', img.naturalWidth / img.naturalHeight);
    };

    if (img.complete) {
      setRatio();
    } else {
      img.addEventListener('load', setRatio, { once: true });
    }
  });
}

function measurePanSections() {
  panSections.forEach((item) => {
    if (!item.stage || !item.moving) return;

    const stageWidth = item.stage.clientWidth || window.innerWidth;
    const stageHeight = item.stage.offsetHeight || window.innerHeight;
    const movingWidth = item.moving.scrollWidth || item.moving.offsetWidth;

    item.maxTranslate = Math.max(movingWidth - stageWidth, 0);

    const useEndHold = !item.section.hasAttribute('data-no-end-hold');
    item.endHold = useEndHold && item.maxTranslate > 0 ? stageHeight * END_HOLD_RATIO : 0;
    item.section.style.height = `${stageHeight + item.maxTranslate + item.endHold}px`;

    const rect = item.section.getBoundingClientRect();
    item.start = window.scrollY + rect.top;
  });
}

function syncPanTargets() {
  const scrollTop = window.scrollY;

  panSections.forEach((item) => {
    if (item.maxTranslate <= 0) {
      item.targetProgress = 0;
      return;
    }

    const passed = scrollTop - item.start;
    item.targetProgress = clamp(passed / item.maxTranslate, 0, 1);
  });
}

function animatePanSections() {
  panSections.forEach((item) => {
    if (!item.moving) return;

    item.currentProgress += (item.targetProgress - item.currentProgress) * 0.16;

    if (Math.abs(item.targetProgress - item.currentProgress) < 0.001) {
      item.currentProgress = item.targetProgress;
    }

    const x = -(item.currentProgress * item.maxTranslate);
    item.moving.style.setProperty('--pan-x', `${x}px`);
  });

  requestAnimationFrame(animatePanSections);
}

function refresh() {
  markImageRatios();
  measurePanSections();
  syncPanTargets();
}

window.addEventListener('resize', refresh);
window.addEventListener('scroll', syncPanTargets, { passive: true });
window.addEventListener('load', refresh);

markImageRatios();
initLazyImages();
initLanguageToggles();
refresh();
animatePanSections();
