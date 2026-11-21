const AUTOPLAY_MS = 3500; // time between slides
const RESUME_MS = 6000;   // pause after the user touches the carousel

const track = document.querySelector("[data-carousel]");

if (track) {
  const cards = [...track.children];
  const step = () => cards[1].offsetLeft - cards[0].offsetLeft;
  const isSwipeable = () => track.scrollWidth > track.clientWidth + 1; // false on the desktop grid
  const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  let pausedUntil = 0;

  const pause = () => { pausedUntil = Date.now() + RESUME_MS; };
  ["pointerdown", "touchstart", "wheel", "focusin"].forEach((type) =>
    track.addEventListener(type, pause, { passive: true }));

  setInterval(() => {
    if (!isSwipeable() || document.hidden || Date.now() < pausedUntil) return;
    const next = (Math.round(track.scrollLeft / step()) + 1) % cards.length; // wraps back to the first card
    track.scrollTo({ left: next * step(), behavior });
  }, AUTOPLAY_MS);
}