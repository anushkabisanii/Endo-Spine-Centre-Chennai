const header = document.querySelector(".site-header");
const toggle = header.querySelector(".menu-toggle");

function setMenu(open) {
  header.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", open);
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

toggle.addEventListener("click", () => setMenu(!header.classList.contains("is-open")));
header.querySelectorAll(".site-nav a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("click", (event) => { if (!header.contains(event.target)) setMenu(false); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenu(false); });