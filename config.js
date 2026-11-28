const CLINIC_WHATSAPP = "919342919485"; // country code + number, no "+"
const BOOKING_EMAIL = "anushkabisani@gmail.com"; // receives booking requests
const SLOT_MINUTES = 15;
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwW9tWgdTthX1uYV4X5f3hGgf8cm0pI7ZQb8tI_iQF6jQqXtV09XJImJmTEUnQeOiBS9g/exec";

// Opening hours. days: 0 = Sunday ... 6 = Saturday. open/close are 24-hour clock hours.
const CLINIC_HOURS = [
  { label: "Monday – Saturday", days: [1, 2, 3, 4, 5, 6], open: 16, close: 21 },
  { label: "Sunday", days: [0], open: 10, close: 13 },
];

// Any link with data-whatsapp="message" opens a WhatsApp chat with that message.
document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  link.href = `https://wa.me/${CLINIC_WHATSAPP}?text=${encodeURIComponent(link.dataset.whatsapp)}`;
});