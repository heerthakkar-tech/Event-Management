const transporter = require("../config/mailer");

const sendWaitlistPromotionEmail = async ({
  name,
  email,
  eventTitle,
  eventStartAt,
  eventLocation,
}) => {
  const subject = `Registration Confirmed - ${eventTitle}`;

  const message = `Hello ${name},

Good news! A seat has become available, and your waitlist registration for "${eventTitle}" has now been confirmed.

Event Details:
Event: ${eventTitle}
Date: ${new Date(eventStartAt).toLocaleString()}
Location: ${eventLocation}

Your registration is now confirmed. We look forward to seeing you at the event!

Thank you.`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text: message,
  });
};

module.exports = sendWaitlistPromotionEmail;
