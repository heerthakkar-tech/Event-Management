const transporter = require("../config/mailer");

const sendScheduleUpdateEmail = async ({
  name,
  email,
  eventTitle,
  eventStartAt,
  eventEndAt,
}) => {
  const message = `Hello ${name},

The schedule for "${eventTitle}" has been updated.

Here is the updated event schedule:

Event: ${eventTitle}
New Start Date and Time: ${new Date(eventStartAt).toLocaleString()}
New End Date and Time: ${new Date(eventEndAt).toLocaleString()}

Please take note of the updated schedule.

We look forward to seeing you at the event!

Thank you.`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Event Schedule Updated - ${eventTitle}`,
    text: message,
  });
};

module.exports = sendScheduleUpdateEmail;
