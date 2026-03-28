document.addEventListener("DOMContentLoaded", function () {
  var THRESHOLD_SQ = 64;
  var TOTAL = 7;
  var HIT_PAD = 30;

  var trashBtn = document.querySelector(".poster__trash");
  var badge = document.querySelector(".poster__trash-badge");
  if (!trashBtn || !badge) return;

  var selectors = [
    ".robots__deco--candy",
    ".robots__deco--lightbulb",
    ".robots__deco--clock-figure",
    ".robots__deco--items-bottle",
    ".robots__deco--items-opposite",
    ".robots__deco--final-gears",
    ".robots__deco--final-ufo"
  ];

  var collected = 0;
  var dragging = null;

  function isOverTrash(x, y) {
    var r = trashBtn.getBoundingClientRect();
    return (
      x >= r.left - HIT_PAD &&
      x <= r.right + HIT_PAD &&
      y >= r.top - HIT_PAD &&
      y <= r.bottom + HIT_PAD
    );
  }

  function showPopup() {
    var el = document.getElementById("trash-popup");
    if (el) {
      el.classList.add("trash-popup-overlay--visible");
      document.body.style.overflow = "hidden";
    }
  }

  function hidePopup() {
    var el = document.getElementById("trash-popup");
    if (el) {
      el.classList.remove("trash-popup-overlay--visible");
      document.body.style.overflow = "";
    }
  }

  var popupBtn = document.getElementById("trash-popup-btn");
  if (popupBtn) popupBtn.addEventListener("click", hidePopup);

  function makeClone(img) {
    var r = img.getBoundingClientRect();
    var c = document.createElement("img");
    c.src = img.src;
    c.className = "drag-clone";
    c.style.left = r.left + "px";
    c.style.top = r.top + "px";
    c.style.width = r.width + "px";
    c.style.height = r.height + "px";
    document.body.appendChild(c);
    return c;
  }

  function dropAnim(clone, cb) {
    var r = trashBtn.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var w = parseFloat(clone.style.width) || 0;
    var h = parseFloat(clone.style.height) || 0;

    clone.style.transformOrigin = "center center";
    clone.classList.add("drag-clone--dropping");
    void clone.offsetWidth;

    requestAnimationFrame(function () {
      clone.style.left = cx - w / 2 + "px";
      clone.style.top = cy - h / 2 + "px";
      clone.style.transform = "scale(0)";
      clone.style.opacity = "0";
    });

    var done = false;
    function fin() {
      if (done) return;
      done = true;
      if (clone.parentNode) clone.remove();
      if (cb) cb();
    }
    function onTE(ev) {
      if (ev.target !== clone) return;
      if (
        ev.propertyName !== "opacity" &&
        ev.propertyName !== "transform" &&
        ev.propertyName !== "left" &&
        ev.propertyName !== "top"
      ) {
        return;
      }
      fin();
    }
    clone.addEventListener("transitionend", onTE);
    setTimeout(function () {
      clone.removeEventListener("transitionend", onTE);
      fin();
    }, 550);
  }

  function returnAnim(clone, wrap, homeLeft, homeTop) {
    if (homeLeft === undefined || homeTop === undefined || isNaN(homeLeft) || isNaN(homeTop)) {
      if (clone.parentNode) clone.remove();
      wrap.classList.remove("robots__deco-wrap--hidden");
      return;
    }

    clone.classList.remove("drag-clone--dropping");
    clone.style.transform = "";
    clone.style.opacity = "1";
    clone.classList.add("drag-clone--returning");
    void clone.offsetWidth;

    requestAnimationFrame(function () {
      clone.style.left = homeLeft + "px";
      clone.style.top = homeTop + "px";
    });

    var done = false;
    function fin() {
      if (done) return;
      done = true;
      clone.removeEventListener("transitionend", onTE);
      if (clone.parentNode) clone.remove();
      wrap.classList.remove("robots__deco-wrap--hidden");
    }
    function onTE(ev) {
      if (ev.target !== clone) return;
      if (ev.propertyName !== "left" && ev.propertyName !== "top") return;
      fin();
    }
    clone.addEventListener("transitionend", onTE);
    setTimeout(fin, 450);
  }

  function releaseCap(el, pointerId) {
    try {
      if (el.releasePointerCapture) el.releasePointerCapture(pointerId);
    } catch (err) {}
  }

  function bounceTrash() {
    trashBtn.classList.remove("poster__trash--bounce");
    void trashBtn.offsetWidth;
    trashBtn.classList.add("poster__trash--bounce");
    trashBtn.addEventListener("animationend", function () {
      trashBtn.classList.remove("poster__trash--bounce");
    }, { once: true });
  }

  function setup(img) {
    var wrap = img.closest(".robots__deco-wrap");
    if (!wrap) return;

    img.classList.add("robots__deco--draggable");

    function disarmGlobalPointers(d) {
      if (!d || !d._globalUp) return;
      window.removeEventListener("pointerup", d._globalUp, true);
      window.removeEventListener("pointercancel", d._globalCancel, true);
      d._globalUp = null;
      d._globalCancel = null;
    }

    function onDown(e) {
      if (dragging) return;
      if (e.button !== undefined && e.button !== 0) return;

      e.preventDefault();
      img.setPointerCapture(e.pointerId);

      var r = img.getBoundingClientRect();
      dragging = {
        pid: e.pointerId,
        img: img,
        wrap: wrap,
        sx: e.clientX,
        sy: e.clientY,
        ox: e.clientX - r.left,
        oy: e.clientY - r.top,
        active: false,
        clone: null,
        homeLeft: undefined,
        homeTop: undefined,
        _globalUp: null,
        _globalCancel: null
      };

      function globalUp(ev) {
        if (!dragging || dragging.img !== img || ev.pointerId !== dragging.pid) return;
        onUp(ev);
      }
      function globalCancel(ev) {
        if (!dragging || dragging.img !== img || ev.pointerId !== dragging.pid) return;
        onCancel(ev);
      }
      dragging._globalUp = globalUp;
      dragging._globalCancel = globalCancel;
      window.addEventListener("pointerup", globalUp, true);
      window.addEventListener("pointercancel", globalCancel, true);
    }

    function onMove(e) {
      if (!dragging || dragging.img !== img) return;

      if (!dragging.active) {
        var dx = e.clientX - dragging.sx;
        var dy = e.clientY - dragging.sy;
        if (dx * dx + dy * dy < THRESHOLD_SQ) return;

        dragging.active = true;
        var ir = img.getBoundingClientRect();
        dragging.homeLeft = ir.left;
        dragging.homeTop = ir.top;
        dragging.clone = makeClone(img);
        wrap.classList.add("robots__deco-wrap--hidden");
      }

      e.preventDefault();

      dragging.clone.style.left = e.clientX - dragging.ox + "px";
      dragging.clone.style.top = e.clientY - dragging.oy + "px";

      if (isOverTrash(e.clientX, e.clientY)) {
        trashBtn.classList.add("poster__trash--drag-over");
      } else {
        trashBtn.classList.remove("poster__trash--drag-over");
      }
    }

    function onUp(e) {
      if (!dragging || dragging.img !== img) return;

      var d = dragging;
      var pid = d.pid;
      var wasActive = d.active;
      var clone = d.clone;
      var w = d.wrap;
      var homeLeft = d.homeLeft;
      var homeTop = d.homeTop;

      dragging = null;
      disarmGlobalPointers(d);
      releaseCap(img, pid);

      trashBtn.classList.remove("poster__trash--drag-over");
      if (!wasActive || !clone) return;

      if (isOverTrash(e.clientX, e.clientY)) {
        collected++;
        badge.textContent = String(collected);
        bounceTrash();

        dropAnim(clone, function () {
          if (collected >= TOTAL) {
            setTimeout(showPopup, 500);
          }
        });

        img.removeEventListener("pointerdown", onDown);
        img.removeEventListener("pointermove", onMove);
        img.removeEventListener("pointerup", onUp);
        img.removeEventListener("pointercancel", onCancel);
        img.removeEventListener("lostpointercapture", onLostCap);
        img.classList.remove("robots__deco--draggable");
      } else {
        returnAnim(clone, w, homeLeft, homeTop);
      }
    }

    function onCancel(e) {
      if (!dragging || dragging.img !== img) return;

      var d = dragging;
      var pid = d.pid;
      var wasActive = d.active;
      var clone = d.clone;
      var w = d.wrap;
      var homeLeft = d.homeLeft;
      var homeTop = d.homeTop;

      dragging = null;
      disarmGlobalPointers(d);
      releaseCap(img, pid);

      trashBtn.classList.remove("poster__trash--drag-over");
      if (!wasActive || !clone) return;
      returnAnim(clone, w, homeLeft, homeTop);
    }

    function onLostCap(e) {
      if (e.pointerId === undefined) return;
      if (!dragging || dragging.img !== img || dragging.pid !== e.pointerId) return;
      onCancel(e);
    }

    img.addEventListener("pointerdown", onDown);
    img.addEventListener("pointermove", onMove);
    img.addEventListener("pointerup", onUp);
    img.addEventListener("pointercancel", onCancel);
    img.addEventListener("lostpointercapture", onLostCap);
  }

  selectors.forEach(function (sel) {
    var el = document.querySelector(sel);
    if (el) setup(el);
  });

  badge.textContent = "0";
});
