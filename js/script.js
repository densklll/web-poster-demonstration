document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll(".hero__input");
  const dots = document.querySelectorAll(".hero__dot");
  const btn = document.getElementById("hero-btn");
  const cardForm = document.getElementById("card-form");
  const cardSuccess = document.getElementById("card-success");
  const marqueeSlots = document.querySelectorAll("[data-slot='label']");
  const marqueeTracks = document.querySelectorAll(".poster__marquee-track");

  function buildMarqueeContent() {
    const values = Array.from(inputs).map(input => input.value.trim()).filter(Boolean);
    return values.join(" · ");
  }

  function updateMarquees() {
    const text = buildMarqueeContent();
    marqueeTracks.forEach((track) => track.classList.add("is-updating"));
    document.querySelectorAll(".poster__marquee-group").forEach(g => g.classList.add("is-updating"));
    setTimeout(() => {
      marqueeSlots.forEach((slot) => { 
        slot.textContent = text ? text + " · " : "\u00A0"; 
      });
      marqueeTracks.forEach((track) => track.classList.remove("is-updating"));
      document.querySelectorAll(".poster__marquee-group").forEach(g => g.classList.remove("is-updating"));
    }, 250);
  }

  function checkInputs() {
    let allFilled = true;
    inputs.forEach((input, i) => {
      if (input.value.trim() !== "") {
        dots[i].classList.add("active");
      } else {
        dots[i].classList.remove("active");
        allFilled = false;
      }
    });
    btn.disabled = !allFilled;
  }

  inputs.forEach((input) => {
    input.addEventListener("input", () => checkInputs());
  });

  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    updateMarquees();
    btn.style.opacity = "0";
    btn.style.pointerEvents = "none";
    cardForm.style.transition = "opacity 0.35s ease";
    cardForm.style.opacity = "0";
    cardForm.style.pointerEvents = "none";
    setTimeout(() => {
      cardForm.style.visibility = "hidden";
      cardSuccess.style.display = "flex";
      cardSuccess.style.opacity = "0";
      cardSuccess.style.transition = "opacity 0.35s ease";
      requestAnimationFrame(() => { cardSuccess.style.opacity = "1"; });

      setTimeout(() => {
        const robotsCard = document.getElementById("robots-card");
        if (robotsCard) {
          robotsCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 1000);
    }, 350);
  });

  checkInputs();
});
