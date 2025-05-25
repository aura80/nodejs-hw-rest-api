const { v4: uuidv4 } = require('uuid');
const sendVerificationMail = require("../helpers/sendEmail");
const Joi = require("joi");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");


const signupSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "any.required": "missing required email field",
        "string.email": "Email must be a valid email address",
    }),
    password: Joi.string().min(6).required().messages({
        "any.required": "missing required password field",
        "string.min": "Password should have at least 6 characters",
    }),
});

const signup = async (req, res) => {
    try {
        console.log("🔹 Received signup request:", req.body); 

        const { error } = signupSchema.validate(req.body);

        if (error) {
            console.log("❌ Validation Error:", error.details[0].message);
            return res
                .status(400)
                .json({ message: "Validation Error", details: error.details[0].message });
        }

        const { email, password } = req.body;
        console.log("🔹 Checking existing user...");
    
        const existingUser = await User.findOne({ email });
        console.log("🔹 Existing user:", existingUser);
        
        if (existingUser) {
            console.log("❌ Email already in use!");
            return res.status(409).json({ message: 'Email already in use' });
        }

        console.log("🔹 Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("🔹 Generating avatar URL...");
        const avatarURL = gravatar.url(email, { s: '250', d: 'retro' });

        console.log("🔹 Generating verification token...");
        const verificationToken = uuidv4();

        console.log("🔹 Saving user in DB...");
        const newUser = await User.create({
            email,
            password: hashedPassword,
            avatarURL,
            verificationToken,
            verify: false,
        });

        console.log("✅ Saved user in DB:", newUser);
      
        console.log("🔹 Sending verification email...");
        await sendVerificationMail(email, verificationToken);

        console.log("✅ Verification email sent!");

        res.status(201).json({
            message: 'User registered successfully. Please verify your email.',
            user: {
                email: newUser.email,
                subscription: newUser.subscription,
                avatarURL: newUser.avatarURL,
            },
        });
    } catch (error) {
        console.error("❌ Internal server error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const resendVerificationEmail = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "missing required field email" });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
        return res.status(400).json({ message: "Verification has already been passed" });
    }

    await sendVerificationMail(user.email, user.verificationToken);

    res.status(200).json({ message: "Verification email sent" });
}

module.exports = {
  signup,
  resendVerificationEmail,
};