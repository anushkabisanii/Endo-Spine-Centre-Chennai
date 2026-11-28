const form = document.getElementById("booking-form");
const success = document.querySelector(".success");
const errorMessage = form.querySelector(".form-error");
const submitButton = form.querySelector("button[type=submit]");
const submitLabel = submitButton.textContent;
const slotsBox = document.getElementById("slots");
const dateInput = form.elements.date;
const phoneInput = form.elements.phone;
const DEFAULT_ERROR = errorMessage.textContent;

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

function showSuccess({ name, phone, email, date, time }) {
  document.getElementById("success-summary").textContent =
    `Thank you, ${name}. We have received your request for ${formatDate(date)} at ${time}. ` +
    `The clinic will call you on ${phone} to confirm your slot.` +
    (email ? ` Once confirmed, we will also email you at ${email}.` : "");
  form.hidden = true;
  success.hidden = false;
  success.scrollIntoView();
}

document.getElementById("clinic-hours").innerHTML = CLINIC_HOURS.map(
  ({ label, open, close }) => `<li><span>${label}</span><span>${formatTime(open * 60)} – ${formatTime(close * 60)}</span></li>`
).join("");

dateInput.min = toDateValue(new Date());

// ---------- Time slots ----------
// The whole time section stays hidden until a date is picked.
const timePicker = document.getElementById("time-picker");

const statusBox = (text, { loading = false, error = false } = {}) =>
  `<p class="tp-status${error ? " is-error" : ""}" role="${error ? "alert" : "status"}">` +
  `${loading ? '<span class="tp-spinner" aria-hidden="true"></span>' : ""}${text}</p>`;

// One row per hour: a label on the left, then a chip for each slot (4:00, 4:15, 4:30, 4:45).
// Booked (or already past) times stay in place but are greyed out and cannot be picked.
function renderSlots(slots, open) {
  if (!open.size) {
    slotsBox.innerHTML = statusBox("No slots left on this date. Please pick another.");
    return;
  }
  const perHour = Math.ceil(60 / SLOT_MINUTES);
  const groups = new Map();
  slots.forEach((slot) => {
    const [, hour, minutes, period] = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(slot);
    const key = `${hour} ${period}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ slot, time: `${hour}:${minutes}`, minutes });
  });
  slotsBox.innerHTML = `<div class="tp-groups">` + [...groups].map(([hour, items]) =>
    `<div class="tp-group"><span class="tp-hour">${hour}</span><div class="tp-row" style="--cols:${perHour}">` +
    items.map(({ slot, time, minutes }) => {
      const free = open.has(slot);
      return `<label class="tp-chip" style="grid-column:${Number(minutes) / SLOT_MINUTES + 1}"${free ? "" : ' title="Not available"'}>` +
        `<input type="radio" name="time" value="${slot}" aria-label="${slot}${free ? "" : " (not available)"}"${free ? " required" : " disabled"}>` +
        `<span>${time}</span></label>`;
    }).join("") +
    `</div></div>`
  ).join("") + `</div>`;
}

// Ask the Google Sheet which times are already taken on a date.
async function fetchBooked(date) {
  const response = await fetch(`${APPS_SCRIPT_URL}?date=${encodeURIComponent(date)}`);
  const result = await response.json();
  return result.booked || [];
}

// Show the section with a "checking" box, then replace it with the free times.
let loadToken = 0;
async function loadSlots(date) {
  const token = ++loadToken;
  dateInput.setCustomValidity("");
  timePicker.hidden = false;
  slotsBox.innerHTML = statusBox("Checking availability…", { loading: true });
  try {
    const booked = await fetchBooked(date);
    if (token !== loadToken) return; // a newer date was picked meanwhile
    const everySlot = slotsFor(CLINIC_HOURS.find(({ days }) => days.includes(parseDate(date).getDay())));
    const open = new Set(availableSlots(date).filter((slot) => !booked.includes(slot)));
    renderSlots(everySlot, open);
    dateInput.setCustomValidity(open.size ? "" : "No slots left on this date. Please pick another.");
  } catch {
    if (token !== loadToken) return;
    slotsBox.innerHTML = statusBox("Could not check availability. Please pick the date again.", { error: true });
    dateInput.setCustomValidity("Could not check availability. Please try again.");
  }
}

dateInput.addEventListener("change", () => {
  if (!dateInput.value) {
    loadToken++;
    dateInput.setCustomValidity("");
    timePicker.hidden = true;
    slotsBox.innerHTML = "";
    return;
  }
  loadSlots(dateInput.value);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  errorMessage.hidden = true;
  submitButton.disabled = true;
  submitButton.textContent = "Sending…";

  try {
    // text/plain avoids a CORS preflight, which Apps Script does not answer.
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        email: data.email || "",
        date: data.date,
        time: data.time,
        concern: data.concern || "",
        description: data.description || "",
      }),
    });
    const result = await response.json();

    if (result.ok) {
      showSuccess(data);
      return;
    }
    if (result.error === "taken") {
      errorMessage.textContent = "Sorry, that time was just booked. Please choose another slot.";
      loadSlots(data.date);
    } else if (result.error === "limit") {
      errorMessage.textContent = "You already have a request for this day. Please call the clinic to change it.";
    } else {
      errorMessage.textContent = DEFAULT_ERROR;
    }
    throw new Error(result.error);
  } catch {
    if (errorMessage.textContent === "") errorMessage.textContent = DEFAULT_ERROR;
    errorMessage.hidden = false;
    submitButton.disabled = false;
    submitButton.textContent = submitLabel;
  }
});