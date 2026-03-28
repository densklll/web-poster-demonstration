document.addEventListener("DOMContentLoaded", () => {
  const card = document.getElementById("robots-card");
  const robot = document.getElementById("walker-robot");
  const gameResult = document.getElementById("game-result");

  if (!card || !robot || !gameResult) return;

  const TOTAL_ENVELOPES = 13;
  const ENVELOPE_SIZE_PERCENT = 10;
  const FALL_DURATION_MIN = 2800;
  const FALL_DURATION_MAX = 4800;
  const SPAWN_INTERVAL = 900;
  const CATCH_THRESHOLD_PERCENT = 12;
  const PARTICLE_COUNT = 15;

  const ENVELOPE_IMAGES = ["images/envelope-open.png", "images/envelope-closed.png"];
  const ROTATIONS = [-20, -12, -5, 0, 5, 12, 20];

  let active = [];
  let spawned = 0;
  let caught = 0;
  let missed = 0;
  let gameStarted = false;
  let gameOver = false;
  let spawnTimer = null;
  let rafId = null;

  function getRobotCenterPercent() {
    const cardW = card.offsetWidth;
    const robotRect = robot.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const robotCenterX = robotRect.left - cardRect.left + robotRect.width / 2;
    return (robotCenterX / cardW) * 100;
  }

  function spawnEnvelope() {
    if (spawned >= TOTAL_ENVELOPES || gameOver) {
      clearInterval(spawnTimer);
      return;
    }

    spawned++;

    const el = document.createElement("img");
    el.src = ENVELOPE_IMAGES[Math.floor(Math.random() * ENVELOPE_IMAGES.length)];
    el.classList.add("envelope-item");

    const leftPercent = 5 + Math.random() * (85 - ENVELOPE_SIZE_PERCENT);
    const rotation = ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];
    const duration = FALL_DURATION_MIN + Math.random() * (FALL_DURATION_MAX - FALL_DURATION_MIN);

    el.style.left = leftPercent + "%";
    el.style.width = ENVELOPE_SIZE_PERCENT + "%";
    el.style.transform = "rotate(" + rotation + "deg)";

    card.appendChild(el);

    active.push({
      el,
      leftPercent,
      topPercent: 0,
      duration,
      startTime: performance.now(),
      caught: false,
      fadingOut: false,
    });
  }

  const PARTICLE_COLORS = ["#fe572a"];

  function spawnParticles(x, y) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = document.createElement("div");
      p.classList.add("envelope-particle");

      const angle = (360 / PARTICLE_COUNT) * i + Math.random() * 40 - 20;
      const dist = 50 + Math.random() * 80;
      const dx = Math.cos((angle * Math.PI) / 180) * dist;
      const dy = Math.sin((angle * Math.PI) / 180) * dist;
      const size = 4 + Math.random() * 7;
      const dur = 0.5 + Math.random() * 0.4;
      const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

      p.style.left = x + "%";
      p.style.top = y + "%";
      p.style.setProperty("--dx", dx + "px");
      p.style.setProperty("--dy", dy + "px");
      p.style.setProperty("--size", size + "px");
      p.style.setProperty("--dur", dur + "s");
      p.style.setProperty("--color", color);

      card.appendChild(p);
      p.addEventListener("animationend", () => p.remove(), { once: true });
    }
  }

  function blinkRobot() {
    robot.classList.remove("is-blinking");
    void robot.offsetWidth;
    robot.classList.add("is-blinking");
    robot.addEventListener("animationend", () => {
      robot.classList.remove("is-blinking");
    }, { once: true });
  }

  function endGame() {
    if (gameOver) return;
    gameOver = true;
    clearInterval(spawnTimer);
    cancelAnimationFrame(rafId);

    const allCaught = caught === TOTAL_ENVELOPES;
    gameResult.textContent = allCaught ? "ПОБЕДА!" : "Игра окончена";
    gameResult.classList.add("is-visible");
  }

  function checkGameEnd() {
    if (caught + missed >= TOTAL_ENVELOPES && active.length === 0) {
      endGame();
    }
  }

  function gameLoop(now) {
    if (gameOver) return;

    const cardH = card.offsetHeight;
    const robotCenter = getRobotCenterPercent();
    const robotRect = robot.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const robotTopPercent = ((robotRect.top - cardRect.top) / cardH) * 100;

    for (let i = active.length - 1; i >= 0; i--) {
      const item = active[i];
      if (item.caught || item.fadingOut) continue;

      const elapsed = now - item.startTime;
      const progress = elapsed / item.duration;
      item.topPercent = progress * 103;
      item.el.style.top = item.topPercent + "%";

      const horizontalDist = Math.abs(item.leftPercent + ENVELOPE_SIZE_PERCENT / 2 - robotCenter);
      const verticalContact = item.topPercent + ENVELOPE_SIZE_PERCENT >= robotTopPercent &&
                              item.topPercent <= robotTopPercent + 15;

      if (horizontalDist < CATCH_THRESHOLD_PERCENT && verticalContact) {
        item.caught = true;
        item.fadingOut = true;
        caught++;
        item.el.classList.add("envelope-caught");
        spawnParticles(
          item.leftPercent + ENVELOPE_SIZE_PERCENT / 2,
          item.topPercent + ENVELOPE_SIZE_PERCENT / 2
        );
        item.el.addEventListener("animationend", () => {
          item.el.remove();
          active.splice(active.indexOf(item), 1);
          checkGameEnd();
        }, { once: true });
        continue;
      }

      if (item.topPercent > 103) {
        item.fadingOut = true;
        missed++;
        blinkRobot();
        item.el.classList.add("envelope-missed");
        item.el.addEventListener("animationend", () => {
          item.el.remove();
          active.splice(active.indexOf(item), 1);
          checkGameEnd();
        }, { once: true });
      }
    }

    rafId = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    if (gameStarted) return;
    gameStarted = true;

    spawnTimer = setInterval(spawnEnvelope, SPAWN_INTERVAL);
    rafId = requestAnimationFrame(gameLoop);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setTimeout(startGame, 1200);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(card);
});
