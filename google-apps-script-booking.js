const CALENDAR_ID = "doitupsalon@gmail.com";
const OWNER_EMAIL = "doitupsalon@gmail.com";
const SENDER_EMAIL = "hello@doitupsalon.com";
const SALON_NAME = "DO IT UP Unisex Salon";
const DEFAULT_HOLD_MINUTES = 60;
const OPEN_MINUTES = 10 * 60;
const CLOSE_MINUTES = 21 * 60;
const CLIENT_SIGNATURE = {
  greeting: "Warm regards,",
  name: SALON_NAME,
  address: "Kothrud, Pune",
  phone: "+91 9158741818"
};

function doGet(e) {
  if (e && e.parameter && e.parameter.action === "accept") {
    return acceptBooking(e.parameter.token);
  }

  return jsonResponse({
    ok: true,
    message: "DO IT UP booking endpoint is running."
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const booking = JSON.parse(e.postData.contents || "{}");
    validateBooking(booking);

    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      throw new Error("Calendar not found. Check CALENDAR_ID.");
    }

    const start = new Date(booking.start);
    const end = booking.end ? new Date(booking.end) : new Date(start.getTime() + DEFAULT_HOLD_MINUTES * 60 * 1000);
    const existingEvents = calendar.getEvents(start, end);
    const token = Utilities.getUuid();
    const acceptUrl = getActionUrl(booking, "accept", token);

    if (existingEvents.length > 0) {
      return jsonResponse({
        ok: false,
        message: "This slot is already booked. Please choose another time."
      });
    }

    const description = [
      "Website booking request",
      "",
      `Name: ${booking.name}`,
      `Phone: ${booking.phone}`,
      booking.email ? `Email: ${booking.email}` : "",
      `Service: ${booking.service}`,
      `Requested time: ${booking.date} at ${booking.time}`,
      `Calendar hold: ${DEFAULT_HOLD_MINUTES} minutes. Owner should adjust duration before confirming.`,
      "",
      "Owner action:",
      `Accept and send client confirmation: ${acceptUrl}`,
      booking.message ? `Message: ${booking.message}` : "",
      booking.whatsappUrl ? `WhatsApp copy: ${booking.whatsappUrl}` : "",
      booking.source ? `Source: ${booking.source}` : ""
    ].filter(Boolean).join("\n");

    const event = calendar.createEvent(
      `[REQUEST] ${booking.service} - ${booking.name}`,
      start,
      end,
      {
        description,
        location: booking.location || ""
      }
    );

    const ownerSubject = `New salon booking: ${booking.service}`;
    const ownerBody = [
      "A new booking was submitted from the website.",
      "",
      `Name: ${booking.name}`,
      `Phone: ${booking.phone}`,
      booking.email ? `Email: ${booking.email}` : "",
      `Service: ${booking.service}`,
      `Date: ${booking.date}`,
      `Time: ${booking.time}`,
      `Calendar hold: ${DEFAULT_HOLD_MINUTES} minutes`,
      "Adjust the event duration manually before sending confirmation to the client.",
      booking.message ? `Message: ${booking.message}` : "",
      booking.whatsappUrl ? `WhatsApp copy: ${booking.whatsappUrl}` : "",
      "",
      `Calendar event: ${event.getId()}`,
      "",
      "Review the request, adjust the calendar event duration if needed, then accept:",
      acceptUrl
    ].filter(Boolean).join("\n");

    const ownerHtml = [
      "<p>A new booking request was submitted from the website.</p>",
      "<ul>",
      `<li><strong>Name:</strong> ${escapeHtml(booking.name)}</li>`,
      `<li><strong>Phone:</strong> ${escapeHtml(booking.phone)}</li>`,
      booking.email ? `<li><strong>Email:</strong> ${escapeHtml(booking.email)}</li>` : "",
      `<li><strong>Service:</strong> ${escapeHtml(booking.service)}</li>`,
      `<li><strong>Date:</strong> ${escapeHtml(booking.date)}</li>`,
      `<li><strong>Time:</strong> ${escapeHtml(booking.time)}</li>`,
      "</ul>",
      "<p>Adjust the calendar event duration if needed, then click Accept to email the client.</p>",
      `<p><a href="${acceptUrl}" style="display:inline-block;padding:12px 18px;background:#14120f;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;">Accept appointment</a></p>`,
      booking.whatsappUrl ? `<p><a href="${booking.whatsappUrl}">Open WhatsApp copy</a></p>` : ""
    ].filter(Boolean).join("");

    PropertiesService.getScriptProperties().setProperty(`booking:${token}`, JSON.stringify({
      eventId: event.getId(),
      booking,
      accepted: false,
      createdAt: new Date().toISOString()
    }));

    sendSalonEmail(OWNER_EMAIL, ownerSubject, ownerBody, ownerHtml);

    return jsonResponse({
      ok: true,
      message: "Booking created.",
      eventId: event.getId()
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      message: error.message
    });
  } finally {
    lock.releaseLock();
  }
}

function acceptBooking(token) {
  if (!token) {
    return htmlResponse("Missing booking token.", "Please open the accept link from the owner email or calendar event.");
  }

  const store = PropertiesService.getScriptProperties();
  const key = `booking:${token}`;
  const raw = store.getProperty(key);

  if (!raw) {
    return htmlResponse("Booking request not found.", "This request may have already been accepted or the link is invalid.");
  }

  const record = JSON.parse(raw);
  const booking = record.booking;

  if (record.accepted) {
    return htmlResponse("Already accepted.", "This appointment request has already been accepted and the client confirmation was already handled.");
  }

  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  const event = calendar && calendar.getEventById(record.eventId);

  if (!event) {
    return htmlResponse("Calendar event not found.", "The request exists, but its calendar hold could not be found.");
  }

  if (!booking.email) {
    return htmlResponse("Accepted in calendar.", "The calendar request exists, but no client email was provided. Please confirm by phone or WhatsApp.");
  }

  event.setTitle(`[CONFIRMED] ${booking.service} - ${booking.name}`);
  event.setDescription([
    event.getDescription(),
    "",
    `Accepted by owner: ${new Date().toISOString()}`,
    `Confirmation sent to: ${booking.email}`
  ].join("\n"));

  const start = event.getStartTime();
  const end = event.getEndTime();
  const dateText = Utilities.formatDate(start, booking.timezone || "Asia/Kolkata", "EEEE, dd MMM yyyy");
  const startText = Utilities.formatDate(start, booking.timezone || "Asia/Kolkata", "hh:mm a");
  const endText = Utilities.formatDate(end, booking.timezone || "Asia/Kolkata", "hh:mm a");

  const clientBody = [
    `Hi ${booking.name},`,
    "",
    `Your ${booking.service} appointment at ${SALON_NAME} is confirmed.`,
    "",
    `Date: ${dateText}`,
    `Time: ${startText} - ${endText}`,
    `Location: ${booking.location || ""}`,
    "",
    CLIENT_SIGNATURE.greeting,
    CLIENT_SIGNATURE.name,
    CLIENT_SIGNATURE.address,
    CLIENT_SIGNATURE.phone
  ].join("\n");

  sendSalonEmail(
    booking.email,
    `Appointment confirmed - ${SALON_NAME}`,
    clientBody,
    [
      `<p>Hi ${escapeHtml(booking.name)},</p>`,
      `<p>Your <strong>${escapeHtml(booking.service)}</strong> appointment at ${escapeHtml(SALON_NAME)} is confirmed.</p>`,
      "<ul>",
      `<li><strong>Date:</strong> ${escapeHtml(dateText)}</li>`,
      `<li><strong>Time:</strong> ${escapeHtml(startText)} - ${escapeHtml(endText)}</li>`,
      `<li><strong>Location:</strong> ${escapeHtml(booking.location || "")}</li>`,
      "</ul>",
      `<p>${escapeHtml(CLIENT_SIGNATURE.greeting)}<br>${escapeHtml(CLIENT_SIGNATURE.name)}<br>${escapeHtml(CLIENT_SIGNATURE.address)}<br>${escapeHtml(CLIENT_SIGNATURE.phone)}</p>`
    ].join("")
  );

  record.accepted = true;
  record.acceptedAt = new Date().toISOString();
  store.setProperty(key, JSON.stringify(record));

  return htmlResponse("Appointment accepted.", `Confirmation email sent to ${booking.email}.`);
}

function getActionUrl(booking, action, token) {
  const baseUrl = booking.endpoint || ScriptApp.getService().getUrl();
  return `${baseUrl}?action=${encodeURIComponent(action)}&token=${encodeURIComponent(token)}`;
}

function sendSalonEmail(to, subject, body, htmlBody) {
  const aliases = GmailApp.getAliases();
  const options = {
    name: SALON_NAME,
    replyTo: OWNER_EMAIL
  };

  if (aliases.indexOf(SENDER_EMAIL) !== -1) {
    options.from = SENDER_EMAIL;
  }

  if (htmlBody) {
    options.htmlBody = htmlBody;
  }

  GmailApp.sendEmail(to, subject, body, options);
}

function validateBooking(booking) {
  const required = ["name", "phone", "service", "date", "time", "start"];
  required.forEach((field) => {
    if (!booking[field]) {
      throw new Error(`Missing field: ${field}`);
    }
  });

  const start = new Date(booking.start);
  const end = booking.end ? new Date(booking.end) : new Date(start.getTime() + DEFAULT_HOLD_MINUTES * 60 * 1000);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error("Invalid booking time.");
  }

  if (!isWithinOpenHours(booking.time)) {
    throw new Error("Selected time is outside salon hours.");
  }
}

function isWithinOpenHours(time) {
  const parts = String(time || "").split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return false;
  }

  const value = hours * 60 + minutes;
  return value >= OPEN_MINUTES && value <= CLOSE_MINUTES;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function htmlResponse(title, message) {
  return HtmlService.createHtmlOutput([
    "<!doctype html>",
    "<html>",
    "<head>",
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    `<title>${escapeHtml(title)}</title>`,
    "</head>",
    "<body style=\"font-family:Arial,sans-serif;margin:32px;line-height:1.5;\">",
    `<h1>${escapeHtml(title)}</h1>`,
    `<p>${escapeHtml(message)}</p>`,
    "</body>",
    "</html>"
  ].join(""));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
