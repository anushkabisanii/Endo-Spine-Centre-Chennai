const CLINIC_WHATSAPP = "9176222561"; // country code + number, no "+"
const BOOKING_EMAIL = "anushkabisani@gmail.com"; // receives booking requests
const SLOT_MINUTES = 30;

// Opening hours. days: 0 = Sunday ... 6 = Saturday. open/close are 24-hour clock hours.
const CLINIC_HOURS = [
  { label: "Monday – Saturday", days: [1, 2, 3, 4, 5, 6], open: 16, close: 21 },
  { label: "Sunday", days: [0], open: 10, close: 13 },
];

// Any link with data-whatsapp="message" opens a WhatsApp chat with that message.
document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  link.href = `https://wa.me/${CLINIC_WHATSAPP}?text=${encodeURIComponent(link.dataset.whatsapp)}`;
});