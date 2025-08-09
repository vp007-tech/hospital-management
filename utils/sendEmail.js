// const nodemailer = require("nodemailer");

// const sendEmail = async (options) => {
//   // Create a transporter
//   let transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   // For testing with Ethereal
//   if (process.env.NODE_ENV === "development") {
//     const testAccount = await nodemailer.createTestAccount();
//     transporter = nodemailer.createTransport({
//       host: "smtp.ethereal.email",
//       port: 587,
//       auth: {
//         user: testAccount.user,
//         pass: testAccount.pass,
//       },
//     });
//   }

//   // Define email options
//   const mailOptions = {
//     from: "Hospital Management System <no-reply@hospital.com>",
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html: options.html (you can add HTML version)
//   };

//   // Send email
//   const info = await transporter.sendMail(mailOptions);

//   if (process.env.NODE_ENV === "development") {
//     console.log("Message sent: %s", info.messageId);
//     console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
//   }
// };

// module.exports = sendEmail;
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Only for testing, remove in production
      },
    });

    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.email,
      subject: options.subject,
      text: options.message,
      // html: options.html (uncomment if you want HTML emails)
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;