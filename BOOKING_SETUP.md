# Google Calendar Booking Setup

GitHub Pages cannot directly write to Google Calendar because that needs private Google permissions. Use the included Apps Script as the secure Google-side endpoint.

## Setup

1. Open Google Apps Script: https://script.google.com/
2. Create a new project.
3. Paste the code from `google-apps-script-booking.js`.
4. Update these constants if needed:
   - `CALENDAR_ID`: the Google Calendar email/id that should receive bookings.
   - `OWNER_EMAIL`: the email address that should receive booking notifications.
   - `SENDER_EMAIL`: the sender alias for salon notification emails. It is currently `hello@doitupsalon.com`.
5. Click **Deploy** > **New deployment**.
6. Choose **Web app**.
7. Set **Execute as** to **Me**.
8. Set **Who has access** to **Anyone**.
9. Deploy and authorize Calendar/Mail permissions.
10. Copy the Web app URL.
11. In `index.html`, paste the URL here:

```html
<form class="booking-form" data-booking-form data-booking-endpoint="PASTE_WEB_APP_URL_HERE">
```

After that, website bookings will create pending Google Calendar request holds and email the salon owner.

The script does not email the client when the request is submitted. It emails the salon owner with an **Accept appointment** link and creates a default 60-minute `[REQUEST]` calendar hold. The same accept link is also added inside the calendar event description.

Overlapping requests are allowed. If a new request conflicts with an existing calendar event, the owner email will include a conflict warning instead of blocking the booking.

Edit the `CLIENT_SIGNATURE` block in `google-apps-script-booking.js` if you want to change the signature that appears in the confirmation email sent after the owner accepts the appointment.

Owner workflow:

1. Review the request email or calendar event.
2. Adjust the calendar event duration manually if needed.
3. Click **Accept appointment** from the owner email or calendar event description.
4. The client receives the confirmation email automatically.
5. The calendar event title changes from `[REQUEST]` to `[CONFIRMED]`.

If you want salon notification emails to come from `hello@doitupsalon.com`, add `hello@doitupsalon.com` as a verified Gmail send-as alias in the Google account that deploys the Apps Script. If the alias is not available, Google will send from the deploying account and use the salon email as the reply-to address.

WhatsApp notes:

The website prepares a WhatsApp copy of the booking after the appointment is submitted. Fully automatic WhatsApp delivery requires a WhatsApp Business API provider and token, which should not be stored in GitHub Pages.

Current connected endpoint:

```text
https://script.google.com/macros/s/AKfycbxxplrcCs8k7pJRsvKSpqacASRIe7X9IzYyuXU-PmaL_Twy7XxJ62hQj0ww3PVkFird/exec
```

Current Apps Script library:

```text
https://script.google.com/macros/library/d/1IyiK131kzMFbfmSZ9J0JtdL_RjEAdr5VUSUnTmSoocrY1Vc2jNp2tVPD/5
```
