const form = document.getElementById("booking-form");
const success = document.querySelector(".success");
const errorMessage = form.querySelector(".form-error");
const submitButton = form.querySelector("button[type=submit]");
const submitLabel = submitButton.textContent;
const slotsBox = document.getElementById("slots");
const dateInput = form.elements.date;
const phoneInput = form.elements.phone;

// Phone: digits only, exactly 10 (the pattern on the input enforces this on submit).
phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
});

const pad = (n) => String(n).padStart(2, "0");
const toDateValue = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (value) => new Date(`${value}T00:00`);
const formatDate = (value) =>
  parseDate(value).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const formatTime = (minutes) => {
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${pad(minutes % 60)} ${hour < 12 ? "AM" : "PM"}`;
};

// Time slots for a set of opening hours.
function slotsFor({ open, close }, earliest = -1) {
  const slots = [];
  for (let m = open * 60; m + SLOT_MINUTES <= close * 60; m += SLOT_MINUTES) {
    if (m > earliest) slots.push(formatTime(m));
  }
  return slots;
}

// Slots for a date, limited to that weekday's opening hours (and to the future if the date is today).
function availableSlots(value) {
  const hours = CLINIC_HOURS.find(({ days }) => days.includes(parseDate(value).getDay()));
  const now = new Date();
  const earliest = value === toDateValue(now) ? now.getHours() * 60 + now.getMinutes() : -1;
  return slotsFor(hours, earliest);
}

function showSuccess({ name, phone, date, time }) {
  document.getElementById("success-summary").textContent =
    `Thank you, ${name}. We have received your request for ${formatDate(date)} at ${time}. ` +
    `The clinic will call you on ${phone} to confirm your slot.`;
  form.hidden = true;
  success.hidden = false;
  success.scrollIntoView();
}

document.getElementById("clinic-hours").innerHTML = CLINIC_HOURS.map(
  ({ label, open, close }) => `<li><span>${label}</span><span>${formatTime(open * 60)} – ${formatTime(close * 60)}</span></li>`
).join("");

dateInput.min = toDateValue(new Date());

// Time chips are always visible. They stay greyed out until a date is chosen.
function renderSlots(slots, enabled) {
  slotsBox.innerHTML = slots.length
    ? slots.map((slot) => `<label class="slot"><input type="radio" name="time" value="${slot}" required${enabled ? "" : " disabled"}><span>${slot}</span></label>`).join("")
    : `<p class="slots-empty">No slots left, pick another date</p>`;
}

const defaultSlots = slotsFor(CLINIC_HOURS[0]);
renderSlots(defaultSlots, false);

dateInput.addEventListener("change", () => {
  const hasDate = Boolean(dateInput.value);
  const slots = hasDate ? availableSlots(dateInput.value) : defaultSlots;
  renderSlots(slots, hasDate);
  // A date with no slots left cannot be submitted.
  dateInput.setCustomValidity(!hasDate || slots.length ? "" : "No slots left on this date. Please pick another.");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  errorMessage.hidden = true;
  submitButton.disabled = true;
  submitButton.textContent = "Sending…";

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${BOOKING_EMAIL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `New appointment request: ${data.name}`,
        _template: "table",
        _captcha: "false",
        Name: data.name,
        Phone: data.phone,
        Date: formatDate(data.date),
        Time: data.time,
        Concern: data.concern || "Not specified",
        Description: data.description || "None",
      }),
    });
    const result = await response.json();
    if (!response.ok || String(result.success) !== "true") throw new Error(result.message);
    showSuccess(data);
  } catch {
    errorMessage.hidden = false;
    submitButton.disabled = false;
    submitButton.textContent = submitLabel;
  }
});