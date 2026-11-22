const AUTOPLAY_MS = 5000; // time between slides
const RESUME_MS = 6000;   // pause after the user touches the carousel
const SETTLE_MS = 120;    // wait for scrolling to stop before looping

const track = document.querySelector("[data-carousel]");

if (track) {
  const originals = [...track.children];
  originals.forEach((card, i) => { card.dataset.n = String(i + 1).padStart(2, "0"); });

  // Clones of the last and first cards sit at either end, so the loop has no visible seam.
  const clone = (card) => {
    const copy = card.cloneNode(true);
    copy.dataset.clone = "";
    copy.setAttribute("aria-hidden", "true");
    return copy;
  };
  track.prepend(clone(originals.at(-1)));
  track.append(clone(originals[0]));

  const cards = [...track.children]; // [clone of last, 1 ... n, clone of first]
  const step = () => cards[2].offsetLeft - cards[1].offsetLeft;
  const index = () => Math.round(track.scrollLeft / step());
  const isSwipeable = () => track.scrollWidth > track.clientWidth + 1; // false on the desktop grid
  const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const jumpTo = (i) => track.scrollTo({ left: i * step(), behavior: "auto" });

  let pausedUntil = 0;
  let touching = false;
  let settleTimer;

  // Once scrolling stops on a clone, jump (instantly) to the identical real card.
  const loop = () => {
    if (!isSwipeable() || touching) return;
    if (index() === 0) jumpTo(originals.length);
    else if (index() === originals.length + 1) jumpTo(1);
  };
  const settle = () => { clearTimeout(settleTimer); settleTimer = setTimeout(loop, SETTLE_MS); };
  const pause = () => { pausedUntil = Date.now() + RESUME_MS; };

  track.addEventListener("scroll", settle, { passive: true });
  track.addEventListener("touchstart", () => { touching = true; }, { passive: true });
  ["touchend", "touchcancel"].forEach((type) =>
    track.addEventListener(type, () => { touching = false; settle(); }, { passive: true }));
  ["pointerdown", "touchstart", "wheel", "focusin"].forEach((type) =>
    track.addEventListener(type, pause, { passive: true }));

  // Start on the first card, with the last card peeking in on its left.
  const start = () => { if (isSwipeable() && track.scrollLeft === 0) jumpTo(1); };
  start();
  addEventListener("resize", start);

  setInterval(() => {
    if (!isSwipeable() || document.hidden || Date.now() < pausedUntil) return;
    track.scrollTo({ left: (index() + 1) * step(), behavior });
  }, AUTOPLAY_MS);
}