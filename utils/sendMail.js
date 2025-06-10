// utils/sendMail.js
const nodemailer = require("nodemailer");

const sendMail = async (to, subject, html) => {
  let transporter = nodemailer.createTransport({
    service: "gmail", // or use SMTP config
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASS,
    },
  });

  let info = await transporter.sendMail({
    from: `"PNINFOSYS" <${process.env.MAIL_ID}>`,
    to,
    subject,
    html,
  });

  console.log("Mail sent: %s", info.messageId);
};

module.exports = sendMail;
