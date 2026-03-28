document.addEventListener("DOMContentLoaded", () => {
  const robot = document.getElementById("walker-robot");
  const card = document.getElementById("robots-card");
  const btnLeft = document.getElementById("walker-btn-left");
  const btnRight = document.getElementById("walker-btn-right");

  if (!robot || !card) return;

  const ROBOT_WIDTH_PERCENT = 25;
  const STEP = 1.5;
  const SCROLL_SENSITIVITY = 0.52;
  const BASE_LEFT = 37.88;
  const WALK_FRAMES = 6;
  const WALK_FRAME_INTERVAL = 100;

  const MIN_LEFT = 10;
  const MAX_LEFT = 90 - ROBOT_WIDTH_PERCENT;

  let offsetPercent = BASE_LEFT;
  let hasDropped = false;
  let scrollAccum = 0;
  let keysHeld = { left: false, right: false };
  let rafId = null;
  let walkFrame = 0;
  let lastFrameSwitch = 0;
  let facingScaleX = 1;
  let scrollWalkActive = false;
  let scrollWalkIdleTimer = null;
  const SCROLL_WALK_IDLE_MS = 160;
  const CARD_PAN_DECIDE_PX = 10;
  const CARD_PAN_VERTICAL_BIAS = 1.28;
  const CARD_PAN_SENS = 1.05;
  let cardPanPointerId = null;
  let cardPanLastX = 0;
  let cardPanOriX = 0;
  let cardPanOriY = 0;
  let cardPanLocked = false;

  function getDeltaPixels() {
    const deltaPercent = offsetPercent - BASE_LEFT;
    return (deltaPercent / 100) * card.offsetWidth;
  }

  function clampOffset(val) {
    return Math.max(MIN_LEFT, Math.min(MAX_LEFT, val));
  }

  function applyPosition() {
    const deltaPixels = getDeltaPixels();
    robot.style.setProperty("--robot-tx", deltaPixels + "px");
    robot.style.setProperty("--robot-scale-x", String(facingScaleX));
    if (!robot.classList.contains("is-dropping")) {
      robot.style.removeProperty("transform");
    }
  }

  function setWalkFrame(frame) {
    robot.style.backgroundPosition = frame * 20 + "% 0%";
  }

  function updateWalkAnimation(now) {
    if (now - lastFrameSwitch >= WALK_FRAME_INTERVAL) {
      walkFrame = (walkFrame + 1) % WALK_FRAMES;
      setWalkFrame(walkFrame);
      lastFrameSwitch = now;
    }
  }

  function clearScrollWalkIdleTimer() {
    if (scrollWalkIdleTimer !== null) {
      clearTimeout(scrollWalkIdleTimer);
      scrollWalkIdleTimer = null;
    }
  }

  function bumpScrollWalk() {
    scrollWalkActive = true;
    clearScrollWalkIdleTimer();
    scrollWalkIdleTimer = setTimeout(() => {
      scrollWalkIdleTimer = null;
      scrollWalkActive = false;
      checkStop();
    }, SCROLL_WALK_IDLE_MS);
    if (!rafId) rafId = requestAnimationFrame(gameLoop);
  }

  function startWalkingVisual() {
    if (robot.classList.contains("robots__illustration-robot--walking")) return;
    robot.classList.add("robots__illustration-robot--walking");
    walkFrame = 0;
    lastFrameSwitch = performance.now();
    setWalkFrame(0);
    applyPosition();
  }

  function stopWalking() {
    if (!robot.classList.contains("robots__illustration-robot--walking")) {
      robot.style.removeProperty("background-position");
      walkFrame = 0;
      return;
    }
    robot.classList.remove("robots__illustration-robot--walking");
    robot.style.removeProperty("background-position");
    walkFrame = 0;
    applyPosition();
  }

  function isWalking() {
    return keysHeld.left || keysHeld.right || scrollWalkActive;
  }

  function checkStop() {
    if (!isWalking()) {
      cancelAnimationFrame(rafId);
      rafId = null;
      stopWalking();
    }
  }

  function triggerDrop() {
    hasDropped = true;

    const cardRect = card.getBoundingClientRect();
    const robotRect = robot.getBoundingClientRect();
    const dropDistance = robotRect.top - cardRect.top + robot.offsetHeight;

    robot.style.setProperty("--robot-drop-y", "-" + Math.round(dropDistance) + "px");

    applyPosition();
    robot.classList.add("is-dropping");
    if (btnLeft) btnLeft.classList.add("is-visible");
    if (btnRight) btnRight.classList.add("is-visible");

    robot.addEventListener(
      "animationend",
      () => {
        robot.classList.remove("is-dropping");
        applyPosition();
      },
      { once: true }
    );
  }

  function moveLeft() {
    facingScaleX = -1;
    offsetPercent = clampOffset(offsetPercent - STEP);
    applyPosition();
  }

  function moveRight() {
    facingScaleX = 1;
    offsetPercent = clampOffset(offsetPercent + STEP);
    applyPosition();
  }

  function gameLoop(now) {
    if (isWalking()) {
      if (robot.classList.contains("robots__illustration-robot--walking")) {
        updateWalkAnimation(now);
      }
      startWalkingVisual();
    }
    if (keysHeld.left) moveLeft();
    if (keysHeld.right) moveRight();
    rafId = requestAnimationFrame(gameLoop);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !hasDropped) {
        setTimeout(triggerDrop, 300);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(card);

  document.addEventListener("keydown", (e) => {
    if (!hasDropped) return;
    if (e.key === "ArrowLeft") keysHeld.left = true;
    if (e.key === "ArrowRight") keysHeld.right = true;
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !rafId) {
      rafId = requestAnimationFrame(gameLoop);
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keysHeld.left = false;
    if (e.key === "ArrowRight") keysHeld.right = false;
    checkStop();
  });

  window.addEventListener(
    "wheel",
    (e) => {
      if (!hasDropped) return;
      const cardRect = card.getBoundingClientRect();
      if (cardRect.top > window.innerHeight || cardRect.bottom < 0) return;
      scrollAccum += e.deltaX * SCROLL_SENSITIVITY;
      if (Math.abs(scrollAccum) >= 1) {
        const steps = Math.round(scrollAccum);
        const prevOffset = offsetPercent;
        const next = clampOffset(offsetPercent + steps * 0.82);
        if (steps < 0) facingScaleX = -1;
        if (steps > 0) facingScaleX = 1;
        offsetPercent = next;
        applyPosition();
        scrollAccum -= steps;
        if (offsetPercent !== prevOffset) {
          bumpScrollWalk();
        }
      }
    },
    { passive: true }
  );

  function endCardPan(e) {
    if (cardPanPointerId == null || e.pointerId !== cardPanPointerId) return;
    if (cardPanLocked && card.releasePointerCapture) {
      try {
        card.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
    cardPanPointerId = null;
    cardPanLocked = false;
  }

  card.addEventListener("pointerdown", (e) => {
    if (!hasDropped) return;
    if (e.button !== 0) return;
    if (e.target.closest("button")) return;
    cardPanPointerId = e.pointerId;
    cardPanLastX = e.clientX;
    cardPanOriX = e.clientX;
    cardPanOriY = e.clientY;
    cardPanLocked = false;
  });

  card.addEventListener("pointermove", (e) => {
    if (cardPanPointerId == null || e.pointerId !== cardPanPointerId) return;
    if (!hasDropped) return;
    const dxTotal = e.clientX - cardPanOriX;
    const dyTotal = e.clientY - cardPanOriY;
    if (!cardPanLocked) {
      if (Math.abs(dxTotal) < CARD_PAN_DECIDE_PX && Math.abs(dyTotal) < CARD_PAN_DECIDE_PX) return;
      if (Math.abs(dyTotal) > Math.abs(dxTotal) * CARD_PAN_VERTICAL_BIAS) {
        cardPanPointerId = null;
        return;
      }
      cardPanLocked = true;
      try {
        card.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    const dx = e.clientX - cardPanLastX;
    cardPanLastX = e.clientX;
    if (dx === 0) return;
    const prevOffset = offsetPercent;
    const deltaPct = (dx / card.offsetWidth) * 100 * CARD_PAN_SENS;
    offsetPercent = clampOffset(offsetPercent + deltaPct);
    if (dx < 0) facingScaleX = -1;
    if (dx > 0) facingScaleX = 1;
    applyPosition();
    if (offsetPercent !== prevOffset) bumpScrollWalk();
  });

  card.addEventListener("pointerup", endCardPan);
  card.addEventListener("pointercancel", endCardPan);

  if (btnLeft) {
    btnLeft.addEventListener("pointerdown", () => {
      keysHeld.left = true;
      if (!rafId) rafId = requestAnimationFrame(gameLoop);
    });
    btnLeft.addEventListener("pointerup", () => {
      keysHeld.left = false;
      checkStop();
    });
    btnLeft.addEventListener("pointerleave", () => {
      keysHeld.left = false;
      checkStop();
    });
  }

  if (btnRight) {
    btnRight.addEventListener("pointerdown", () => {
      keysHeld.right = true;
      if (!rafId) rafId = requestAnimationFrame(gameLoop);
    });
    btnRight.addEventListener("pointerup", () => {
      keysHeld.right = false;
      checkStop();
    });
    btnRight.addEventListener("pointerleave", () => {
      keysHeld.right = false;
      checkStop();
    });
  }
});
