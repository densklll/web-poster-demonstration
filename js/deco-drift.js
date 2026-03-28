document.addEventListener("DOMContentLoaded", () => {
  const DRIFT = {
    base: 47.32,
    orbit: 1.56,
    rotMax: 11.83,
    timeScale: 0.00072,
    strength: 0.68,
  };

  const presets = {
    candy(t, a, orbit, rotEffective, phase) {
      const p = phase;
      const x = Math.sin(t * 0.9 + p) * a;
      const y = Math.cos(t * 0.75 + p) * a * orbit;
      const r = Math.sin(t * 0.5 + p * 0.75) * rotEffective;
      return { x, y, r };
    },
    bulb(t, a, orbit, rotEffective, phase) {
      const p = phase;
      const x = Math.sin(t * 0.85 + 2.1 + p) * a;
      const y = Math.cos(t * 0.95 + 0.7 + p) * a * orbit;
      const r = Math.sin(t * 0.45 + 1 + p) * rotEffective;
      return { x, y, r };
    },
    itemsFloat(t, a, orbit, rotEffective, phase) {
      const p = phase;
      const x = Math.sin(t * 1.12 + p) * a * 0.92;
      const y = Math.cos(t * 0.66 + p * 1.1 + 0.35) * a * orbit;
      const r = Math.sin(t * 0.41 + p * 0.88) * rotEffective;
      return { x, y, r };
    },
    finalA(t, a, orbit, rotEffective, phase) {
      const p = phase;
      const x = Math.cos(t * 0.88 + p * 0.7) * a;
      const y = Math.sin(t * 0.71 + 0.2 + p) * a * orbit;
      const r = Math.cos(t * 0.53 + p) * rotEffective;
      return { x, y, r };
    },
    finalB(t, a, orbit, rotEffective, phase) {
      const p = phase;
      const x = Math.sin(t * 0.68 + 1.1 + p) * a * 0.95;
      const y = Math.sin(t * 1.03 + p * 0.55) * a * orbit * 0.85;
      const r = Math.cos(t * 0.37 + p * 1.2) * rotEffective;
      return { x, y, r };
    },
  };

  const nodes = document.querySelectorAll("[data-deco-drift]");
  if (nodes.length === 0) return;

  nodes.forEach((el) => {
    el.style.animation = "none";
    el.style.webkitAnimation = "none";
  });

  function tick(now) {
    const reduceScale = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0.35
      : 1;
    const s = DRIFT.strength;
    const a = DRIFT.base * reduceScale * s;
    const orbit = DRIFT.orbit;
    const rotEffective = DRIFT.rotMax * reduceScale * s;
    const t = now * DRIFT.timeScale;

    nodes.forEach((el) => {
      const name = el.getAttribute("data-deco-drift");
      const preset = presets[name];
      if (!preset) return;
      const phase = parseFloat(el.getAttribute("data-deco-drift-phase") || "0", 10) || 0;
      const o = preset(t, a, orbit, rotEffective, phase);
      el.style.transform =
        "translateY(-50%) translate(" +
        o.x +
        "px, " +
        o.y +
        "px) rotate(" +
        o.r +
        "deg)";
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
});
