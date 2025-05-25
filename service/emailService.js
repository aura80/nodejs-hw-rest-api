const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationMail = async (email, verificationToken) => {
    const msg = {
        to: email,
        from: "aura_dragan80@yahoo.com",
        subject: "Please verify your email",
        text: `Please verify your email by clicking the link: http://localhost:3000/api/users/verify/${verificationToken}`,
        html: `<strong>Please verify your email by clicking the link: <a href="http://localhost:3000/api/users/verify/${verificationToken}">Verify Email</a></strong>`,
    };
    
    await sgMail.send(msg); // Send the email using SendGrid
    console.log(`Verification email sent to ${email}`);
};

module.exports = sendVerificationMail;