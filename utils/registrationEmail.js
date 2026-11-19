const transporter = require("../config/mailer");

const sendRegistrationEmail = async ({
  name,
  email,
  eventTitle,
  eventStartAt,
  eventLocation,
  status,
  waitlistPosition,
}) => {
  const isConfirmed = status === "confirmed";

  const subject = isConfirmed
    ? `Registration Confirmed - ${eventTitle}`
    : `You are on the Waitlist - ${eventTitle}`;

  const message = isConfirmed
    ? `Hello ${name},

Your registration for "${eventTitle}" has been successfully confirmed!

Event Details:
Event: ${eventTitle}
Date: ${new Date(eventStartAt).toLocaleString()}
Location: ${eventLocation}

We look forward to seeing you at the event!

Thank you.`
    : `Hello ${name},

You have been added to the waitlist for "${eventTitle}".

Event Details:
Event: ${eventTitle}
Date: ${new Date(eventStartAt).toLocaleString()}
Location: ${eventLocation}
Your Waitlist Position: ${waitlistPosition}

We will notify you if a seat becomes available.

Thank you.`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text: message,
  });
};

module.exports = sendRegistrationEmail;
