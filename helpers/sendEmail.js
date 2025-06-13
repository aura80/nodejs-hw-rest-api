const nodemailer = require('nodemailer');

const sendVerificationMail = async (email, verificationToken) => {
  try {
    console.log("🔹 Preparing email for:", email);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification",
      text: `Please verify your email by clicking the following link: http://localhost:3000/api/users/verify/${verificationToken}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Error preparing email:", error);
  }
};

module.exports = sendVerificationMail;