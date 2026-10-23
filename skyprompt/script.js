(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* SCENE VIDEO: covers the frame over its poster frame (see .scene-video in style.css). */
  const VIDEO_SRC = "/media/scene.mp4";

  if (VIDEO_SRC && !reduced) {
    const video = document.createElement("video");
    video.className = "scene-video";
    video.src = VIDEO_SRC;
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-hidden", "true");
    video.style.opacity = "0";
    video.addEventListener("playing", () => {
      video.style.transition = "opacity .6s";
      video.style.opacity = "1";
    }, { once: true });
    document.querySelector(".scene").appendChild(video);
    video.play().catch(() => {});
  }

  if (reduced || !Element.prototype.animate) return;

  /* ENTRANCE: one Web Animations timeline, run once */

  const ease = "cubic-bezier(.2, .8, .2, 1)";
  const at = (el, keyframes, delay, duration, extra = {}) =>
    el && el.animate(keyframes, { delay: delay * 1000, duration: duration * 1000, easing: ease, fill: "both", ...extra });

  // logo and nav buttons fade in
  document.querySelectorAll(".logo, .nav-links a, .nav-x, .nav-pill, .nav-menu").forEach((el, i) => {
    at(el, [{ opacity: 0 }, { opacity: 1 }], i * 0.05, 0.6);
  });

  // highlighter: swipe left to right, then the word lands
  const mark = (el, delay) => {
    if (!el) return;
    at(el, [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }], delay, 0.42,
      { pseudoElement: "::before", easing: "cubic-bezier(.6, 0, .3, 1)" });
    at(el.firstElementChild, [
      { opacity: 0, transform: "translateY(-0.35em) scale(1.18)" },
      { opacity: 1, transform: "translateY(0) scale(1)" }
    ], delay + 0.3, 0.38);
  };

  mark(document.getElementById("hlBegin"), 0.35);

  // headline develops out of a blur
  at(document.getElementById("headline"), [
    { opacity: 0, filter: "blur(14px)", transform: "scale(1.04)" },
    { opacity: 1, filter: "blur(0px)", transform: "scale(1)" }
  ], 0.7, 0.95);

  mark(document.getElementById("hlNoCost"), 1.45);

  // subline settles
  at(document.getElementById("subline"), [
    { opacity: 0, filter: "blur(6px)", transform: "translateY(8px)" },
    { opacity: 1, filter: "blur(0px)", transform: "translateY(0)" }
  ], 1.85, 0.8);
})();
