document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".final__data-container");
  const items = Array.from(document.querySelectorAll(".final__data-item"));
  const robotBox = document.querySelector(".final__robot-box");

  if (!container || items.length === 0) return;

  const entities = items.map((el) => {
    el.style.animation = "none";

    return {
      el,
      x: el.offsetLeft,
      y: el.offsetTop,
      vx: (Math.random() - 0.5) * 1.05,
      vy: (Math.random() - 0.5) * 1.05,
      w: el.offsetWidth,
      h: el.offsetHeight
    };
  });

  function update() {
    const containerW = container.offsetWidth;
    const containerH = container.offsetHeight;

    const rbRect = robotBox.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    const rx1 = rbRect.left - cRect.left + 10;
    const ry1 = rbRect.top - cRect.top + 10;
    const rx2 = rx1 + rbRect.width - 20;
    const ry2 = ry1 + rbRect.height - 20;

    entities.forEach((ent, i) => {
      ent.x += ent.vx;
      ent.y += ent.vy;

      if (ent.x <= 0) { ent.x = 0; ent.vx *= -1; }
      if (ent.x + ent.w >= containerW) { ent.x = containerW - ent.w; ent.vx *= -1; }
      if (ent.y <= 0) { ent.y = 0; ent.vy *= -1; }
      if (ent.y + ent.h >= containerH) { ent.y = containerH - ent.h; ent.vy *= -1; }

      if (ent.x + ent.w > rx1 && ent.x < rx2 && ent.y + ent.h > ry1 && ent.y < ry2) {
        const centerX = ent.x + ent.w / 2;
        const centerY = ent.y + ent.h / 2;
        const rCenterX = (rx1 + rx2) / 2;
        const rCenterY = (ry1 + ry2) / 2;

        if (Math.abs(centerX - rCenterX) > Math.abs(centerY - rCenterY)) {
          ent.vx *= -1;
          ent.x = centerX < rCenterX ? rx1 - ent.w - 2 : rx2 + 2;
        } else {
          ent.vy *= -1;
          ent.y = centerY < rCenterY ? ry1 - ent.h - 2 : ry2 + 2;
        }
      }

      for (let j = i + 1; j < entities.length; j++) {
        const other = entities[j];
        const dx = (ent.x + ent.w / 2) - (other.x + other.w / 2);
        const dy = (ent.y + ent.h / 2) - (other.y + other.h / 2);
        const combinedHalfW = (ent.w + other.w) / 2;
        const combinedHalfH = (ent.h + other.h) / 2;

        if (Math.abs(dx) < combinedHalfW && Math.abs(dy) < combinedHalfH) {
          const overlapX = combinedHalfW - Math.abs(dx);
          const overlapY = combinedHalfH - Math.abs(dy);

          if (overlapX < overlapY) {
            const tempVx = ent.vx;
            ent.vx = other.vx;
            other.vx = tempVx;

            const push = overlapX / 2 + 1;
            ent.x += dx > 0 ? push : -push;
            other.x += dx > 0 ? -push : push;
          } else {
            const tempVy = ent.vy;
            ent.vy = other.vy;
            other.vy = tempVy;

            const push = overlapY / 2 + 1;
            ent.y += dy > 0 ? push : -push;
            other.y += dy > 0 ? -push : push;
          }
        }
      }

      ent.el.style.left = ent.x + "px";
      ent.el.style.top = ent.y + "px";
      ent.el.style.right = "auto";
      ent.el.style.bottom = "auto";
    });

    requestAnimationFrame(update);
  }

  setTimeout(() => {
    entities.forEach(ent => {
      ent.w = ent.el.offsetWidth;
      ent.h = ent.el.offsetHeight;
    });
    update();
  }, 500);
});
