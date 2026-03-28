document.addEventListener("DOMContentLoaded", () => {
  const SPEED = 1.2;

  const tracks = document.querySelectorAll(".poster__marquee-track");

  tracks.forEach((track) => {
    const imgs = Array.from(track.querySelectorAll(".poster__marquee-img"));
    if (imgs.length === 0) return;

    const isReverse = track.closest(".poster__marquee--reverse") !== null;
    let pos = 0;
    let halfWidth = 0;

    track.style.animation = "none";
    track.style.transform = "translateX(0px)";
    if (isReverse) pos = halfWidth;

    function calcHalfWidth() {
      const half = Math.floor(imgs.length / 2);
      let w = 0;
      for (let i = 0; i < half; i++) {
        w += imgs[i].getBoundingClientRect().width;
      }
      return w;
    }

    function step() {
      if (halfWidth === 0) {
        halfWidth = calcHalfWidth();
        if (halfWidth === 0) {
          requestAnimationFrame(step);
          return;
        }
      }

      if (halfWidth === 0) {
        halfWidth = calcHalfWidth();
      }

      if (isReverse) {
        pos -= SPEED;
        if (pos <= 0 && halfWidth > 0) pos += halfWidth;
      } else {
        pos += SPEED;
        if (pos >= halfWidth && halfWidth > 0) pos -= halfWidth;
      }

      track.style.transform = "translateX(" + (-pos) + "px)";
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });
});
