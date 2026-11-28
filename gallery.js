const gallery = document.querySelector("[data-gallery]");

if (gallery) {
  const track = gallery.querySelector(".gallery-track");
  const thumbs = gallery.querySelector(".gallery-thumbs");
  const caption = gallery.querySelector(".gallery-caption");
  const count = gallery.querySelector(".gallery-count");
  const slides = [...track.children];
  const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  const current = () => Math.round(track.scrollLeft / track.clientWidth);
  const goTo = (i) => track.scrollTo({ left: ((i + slides.length) % slides.length) * track.clientWidth, behavior });

  // One thumbnail per slide, built from the slide's own image (or the placeholder if it has none).
  const buttons = slides.map((slide, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "photo";
    button.setAttribute("aria-label", `Show photo ${i + 1}`);
    const image = slide.querySelector("img");
    if (image) button.append(Object.assign(image.cloneNode(), { alt: "" }));
    button.addEventListener("click", () => goTo(i));
    thumbs.append(button);
    return button;
  });

  const update = () => {
    const i = current();
    buttons.forEach((button, n) => button.setAttribute("aria-current", String(n === i)));
    caption.textContent = slides[i].querySelector("figcaption").textContent;
    count.textContent = `${i + 1} / ${slides.length}`;
    thumbs.scrollTo({ left: buttons[i].offsetLeft - (thumbs.clientWidth - buttons[i].offsetWidth) / 2, behavior });
  };

  gallery.querySelectorAll(".gallery-nav").forEach((button) =>
    button.addEventListener("click", () => goTo(current() + Number(button.dataset.dir))));
  track.addEventListener("scroll", update, { passive: true });
  update();
}