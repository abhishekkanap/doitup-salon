const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const form = document.querySelector("[data-booking-form]");
const statusText = document.querySelector("[data-form-status]");
const yearText = document.querySelector("[data-year]");
const ratesDialog = document.querySelector("[data-rates-dialog]");
const ratesOpen = document.querySelector("[data-rates-open]");
const ratesClose = document.querySelector("[data-rates-close]");
const galleryTrack = document.querySelector("[data-gallery-track]");
const galleryPrev = document.querySelector("[data-gallery-prev]");
const galleryNext = document.querySelector("[data-gallery-next]");
const whatsappConfirm = document.querySelector("[data-whatsapp-confirm]");
const submitButton = form.querySelector('button[type="submit"]');
const menuTabs = document.querySelectorAll("[data-menu-tab]");
const menuPanels = document.querySelectorAll("[data-menu-panel]");

const salon = {
  phone: "919158741818",
  timezone: "Asia/Kolkata",
  timezoneOffset: "+05:30",
  defaultHoldMinutes: 60,
  openMinutes: 10 * 60,
  closeMinutes: 21 * 60,
  location: "Kshitij Residency, Shop No. B-13, Mayur Colony Rd, Kothrud, Pune, Maharashtra 411038"
};

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
};

syncHeader();
yearText.textContent = String(new Date().getFullYear());
window.addEventListener("scroll", syncHeader, { passive: true });

document.querySelectorAll(".section-heading, .service-card, .menu-board, .about-image, .about-copy, .insta-card, .booking-copy, .booking-form, .contact-details, .map-wrap").forEach((element) => {
  element.classList.add("reveal");
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14, rootMargin: "0px 0px -60px 0px" });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

menuTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.menuTab;

    menuTabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });

    menuPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.menuPanel === target);
    });
  });
});

ratesOpen.addEventListener("click", () => {
  ratesDialog.showModal();
});

ratesClose.addEventListener("click", () => {
  ratesDialog.close();
});

ratesDialog.addEventListener("click", (event) => {
  if (event.target === ratesDialog) {
    ratesDialog.close();
  }
});

const scrollGallery = (direction) => {
  const card = galleryTrack.querySelector(".insta-card");
  const distance = card ? card.getBoundingClientRect().width + 18 : 320;
  galleryTrack.scrollBy({ left: direction * distance, behavior: "smooth" });
};

galleryPrev.addEventListener("click", () => scrollGallery(-1));
galleryNext.addEventListener("click", () => scrollGallery(1));

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", () => {
  nav.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
});

const pad = (value) => String(value).padStart(2, "0");

const formatOffsetDate = (date, time, duration = 0) => {
  if (!date || !time) {
    return "";
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(year, month - 1, day, hours, minutes);
  value.setMinutes(value.getMinutes() + Number(duration || 0));

  return [
    value.getFullYear(),
    "-",
    pad(value.getMonth() + 1),
    "-",
    pad(value.getDate()),
    "T",
    pad(value.getHours()),
    ":",
    pad(value.getMinutes()),
    ":00",
    salon.timezoneOffset
  ].join("");
};

const getBookingData = () => {
  const data = new FormData(form);

  return {
    name: data.get("name") || "",
    phone: data.get("phone") || "",
    email: data.get("email") || "",
    service: data.get("service") || "",
    date: data.get("date") || "",
    time: data.get("time") || "",
    message: data.get("message") || ""
  };
};

const getBookingMessage = (booking) => [
  "New DO IT UP website booking.",
  `Name: ${booking.name || "Guest"}`,
  `Phone: ${booking.phone}`,
  booking.email ? `Email: ${booking.email}` : "",
  `Service: ${booking.service}`,
  `Date: ${booking.date}`,
  `Time: ${booking.time}`,
  booking.message ? `Message: ${booking.message}` : ""
].filter(Boolean).join("\n");

const getWhatsappUrl = (booking) => {
  return `https://wa.me/${salon.phone}?text=${encodeURIComponent(getBookingMessage(booking))}`;
};

const getTimeMinutes = (time) => {
  const [hours, minutes] = String(time || "").split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return NaN;
  }

  return hours * 60 + minutes;
};

const isWithinOpenHours = (time) => {
  const minutes = getTimeMinutes(time);
  return minutes >= salon.openMinutes && minutes <= salon.closeMinutes;
};

const getBookingPayload = (booking) => ({
  ...booking,
  start: formatOffsetDate(booking.date, booking.time),
  end: formatOffsetDate(booking.date, booking.time, salon.defaultHoldMinutes),
  timezone: salon.timezone,
  location: salon.location,
  defaultHoldMinutes: salon.defaultHoldMinutes,
  whatsappMessage: getBookingMessage(booking),
  whatsappUrl: getWhatsappUrl(booking),
  endpoint: form.dataset.bookingEndpoint.trim(),
  source: window.location.href
});

const updateWhatsappConfirm = () => {
  whatsappConfirm.classList.add("is-hidden");
  whatsappConfirm.href = "#";
};

const today = new Date();
const dateInput = form.querySelector('input[name="date"]');
const timeInput = form.querySelector('input[name="time"]');
dateInput.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
timeInput.min = "10:00";
timeInput.max = "21:00";
form.addEventListener("input", updateWhatsappConfirm);
form.addEventListener("change", updateWhatsappConfirm);
updateWhatsappConfirm();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const booking = getBookingData();
  const name = booking.name || "guest";
  const endpoint = form.dataset.bookingEndpoint.trim();
  const whatsappUrl = getWhatsappUrl(booking);
  whatsappConfirm.href = whatsappUrl;

  if (!isWithinOpenHours(booking.time)) {
    statusText.textContent = "Please choose a valid appointment time.";
    return;
  }

  if (endpoint) {
    submitButton.disabled = true;
    statusText.textContent = "Booking your appointment...";

    fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(getBookingPayload(booking))
    }).then(() => {
      statusText.textContent = `Thank you, ${name}. Your appointment request was sent to the salon. The owner will review it and send confirmation after accepting.`;
      whatsappConfirm.classList.remove("is-hidden");
    }).catch(() => {
      statusText.textContent = "Sorry, booking could not be sent. Please try WhatsApp or call the salon.";
    }).finally(() => {
      submitButton.disabled = false;
    });

    return;
  }

  const bookingText = [
    "Hello DO IT UP, I want to book an appointment.",
    `Name: ${name}`,
    `Phone: ${booking.phone}`,
    booking.email ? `Email: ${booking.email}` : "",
    `Service: ${booking.service}`,
    `Preferred date: ${booking.date}`,
    `Preferred time: ${booking.time}`,
    booking.message ? `Message: ${booking.message}` : ""
  ].filter(Boolean).join("\n");

  window.open(`https://wa.me/${salon.phone}?text=${encodeURIComponent(bookingText)}`, "_blank", "noopener");
  statusText.textContent = `Thank you, ${name}. Connect the booking endpoint to add this directly to the salon calendar and email.`;
  updateWhatsappConfirm();
});

const provideWebMcpContext = () => {
  if (!navigator.modelContext || typeof navigator.modelContext.provideContext !== "function") {
    return;
  }

  navigator.modelContext.provideContext({
    tools: [
      {
        name: "get_salon_contact_details",
        description: "Return public contact details for DO IT UP Unisex Salon.",
        inputSchema: {
          type: "object",
          properties: {}
        },
        execute: async () => ({
          name: "DO IT UP Unisex Salon",
          phone: `+${salon.phone}`,
          whatsapp: `https://wa.me/${salon.phone}`,
          instagram: "https://www.instagram.com/doitup_salon/",
          address: salon.location
        })
      },
      {
        name: "open_booking_form",
        description: "Scroll to the appointment request form.",
        inputSchema: {
          type: "object",
          properties: {}
        },
        execute: async () => {
          document.querySelector("#booking").scrollIntoView({ behavior: "smooth", block: "start" });
          return {
            ok: true,
            message: "Booking form opened."
          };
        }
      }
    ]
  });
};

provideWebMcpContext();
