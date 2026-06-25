const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const END_HOLD_RATIO = 0.28;
const panSections = Array.from(document.querySelectorAll('[data-pan]')).map((section) => ({
  section,
  stage: section.querySelector('.pin-pan__stage'),
  moving: section.querySelector('.pan-moving'),
  textPanel: section.querySelector('.text--copy'),
  textScroll: section.querySelector('.text__scroll'),
  maxTranslate: 0,
  textOverflow: 0,
  totalTravel: 0,
  endHold: 0,
  start: 0,
  targetProgress: 0,
  currentProgress: 0,
}));
const langPanels = Array.from(document.querySelectorAll('[data-lang-toggle]'));

function initLanguageToggles() {
  langPanels.forEach((panel) => {
    const toggle = () => {
      panel.classList.toggle('is-en');
      remeasurePanSections();
    };
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

function measureTextOverflow(textPanel, textScroll) {
  if (!textPanel || !textScroll) return 0;

  textScroll.style.setProperty('--text-y', '0px');
  const visible = textPanel.clientHeight;
  const langs = [...textScroll.querySelectorAll('.lang-content')];

  if (!langs.length) {
    return Math.max(textScroll.scrollHeight - visible, 0);
  }

  let maxOverflow = 0;
  langs.forEach((lang) => {
    const hidden = getComputedStyle(lang).display === 'none';
    if (hidden) lang.style.display = 'block';
    maxOverflow = Math.max(maxOverflow, lang.scrollHeight - visible);
    if (hidden) lang.style.display = '';
  });

  return Math.max(maxOverflow, 0);
}

function measurePanSections() {
  panSections.forEach((item) => {
    if (!item.stage || !item.moving) return;

    const stageWidth = item.stage.clientWidth || window.innerWidth;
    const stageHeight = item.stage.offsetHeight || window.innerHeight;
    const movingWidth = item.moving.scrollWidth || item.moving.offsetWidth;
    const startOffset = item.moving.offsetLeft;

    item.maxTranslate = Math.max(movingWidth + startOffset - stageWidth, 0);
    item.textOverflow = measureTextOverflow(item.textPanel, item.textScroll);
    item.totalTravel = Math.max(item.maxTranslate, item.textOverflow);

    const useEndHold = !item.section.hasAttribute('data-no-end-hold');
    item.endHold = useEndHold && item.totalTravel > 0 ? stageHeight * END_HOLD_RATIO : 0;
    item.section.style.height = `${stageHeight + item.totalTravel + item.endHold}px`;

    const rect = item.section.getBoundingClientRect();
    item.start = window.scrollY + rect.top;
  });
}

function syncPanTargets() {
  const scrollTop = window.scrollY;

  panSections.forEach((item) => {
    if (item.totalTravel <= 0) {
      item.targetProgress = 0;
      return;
    }

    const passed = scrollTop - item.start;
    item.targetProgress = clamp(passed / item.totalTravel, 0, 1);
  });
}

function animatePanSections() {
  panSections.forEach((item) => {
    item.currentProgress += (item.targetProgress - item.currentProgress) * 0.16;

    if (Math.abs(item.targetProgress - item.currentProgress) < 0.001) {
      item.currentProgress = item.targetProgress;
    }

    if (item.moving) {
      const x = -(item.currentProgress * item.maxTranslate);
      item.moving.style.setProperty('--pan-x', `${x}px`);
    }

    if (item.textScroll) {
      const y = -(item.currentProgress * item.textOverflow);
      item.textScroll.style.setProperty('--text-y', `${y}px`);
    }
  });

  requestAnimationFrame(animatePanSections);
}

function remeasurePanSections() {
  measurePanSections();
  syncPanTargets();
}

function initPanSectionRemeasure() {
  panSections.forEach(({ moving, textPanel }) => {
    if (moving) {
      moving.querySelectorAll('img').forEach((img) => {
        if (img.complete && img.naturalWidth) return;
        img.addEventListener('load', remeasurePanSections, { once: true });
      });
    }

    if (textPanel) {
      textPanel.querySelectorAll('img').forEach((img) => {
        if (img.complete && img.naturalWidth) return;
        img.addEventListener('load', remeasurePanSections, { once: true });
      });
    }
  });

  if (typeof ResizeObserver === 'undefined') return;

  const observer = new ResizeObserver(remeasurePanSections);
  panSections.forEach(({ moving, textPanel }) => {
    if (moving) observer.observe(moving);
    if (textPanel) observer.observe(textPanel);
  });
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
initPanSectionRemeasure();
refresh();
animatePanSections();
