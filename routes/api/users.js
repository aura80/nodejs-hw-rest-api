const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const Joi = require('joi');
const authMiddleware = require('../../middlewares/authMiddleware');
const upload = require("../../middlewares/upload");
const fs = require('fs-extra');
const path = require('path');
// const Jimp = require('jimp');
const Jimp = require("jimp").default; 

const { signup } = require('../../controllers/auth');
const { resendVerificationEmail } = require('../../controllers/auth');
// const sendVerificationMail = require('../../service/emailService');

// const gravatar = require('gravatar');

const router = express.Router();

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  password: Joi.string().min(6).required().messages({
    "any.required": "Password is required",
    "string.min": "Password must have at least 6 characters",
  }),
});

const subscriptionSchema = Joi.object({
  subscription: Joi.string()
    .valid("starter", "pro", "business")
    .required()
    .messages({
      "any.required": "Subscription is required",
      "string.email": "Subscription must be 'starter', 'pro', or 'business'",
    }),
});

async function updateExistingUsers() {
  await User.updateMany(
    { verificationToken: { $exists: false } },
    { $set: { verificationToken: crypto.randomUUID() } }
  );
  console.log("✅ Updated existing users with verification tokens.");
}

updateExistingUsers();

router.post('/signup', signup);

// router.post('/signup', async (req, res) => {
//     try {
//         const { error } = signupSchema.validate(req.body);

//         if (error) {
//             return res
//               .status(400)
//               .json({ message: "Validation Error", details: error.details[0].message });
//         }

//         const { email, password } = req.body;

//         const existingUser = await User.findOne({ email });
//         console.log("🔹 Existing user:", existingUser);

//         if (existingUser) {
//             return res.status(409).json({ message: 'Email in use' });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         const avatarURL = gravatar.url(email, { s: '250', d: 'retro' });
      
//         const verificationToken = crypto.randomUUID();

//         const user = await User.create({ email, password: hashedPassword, avatarURL, verificationToken });
      
//         console.log("✅ Saved user in DB:", user);
      
//         await sendVerificationMail(email, verificationToken);

//         res.status(201).json({message: "User registered. Please verify your email.", user: { email: user.email, subscription: user.subscription, avatarURL } });

//     } catch (error) {
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

router.post('/login', async (req, res) => {
    try { 
        console.log("Incoming request body:", req.body);

        const { error } = loginSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        console.log("Found user:", user);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Email or password is wrong' });
        }

        console.log("JWT_SECRET:", process.env.JWT_SECRET);
        console.log("User ID:", user._id);
      
        console.log("🔹 JWT_SECRET value in test:", process.env.JWT_SECRET);

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '5h' });
        user.token = token;
        await user.save();

        console.log("Generated token:", token);

        res.status(200).json({ token, user: { email: user.email, subscription: user.subscription } });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/logout', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        user.token = null;
        await user.save();

        // 204 does not allow a message in response body
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/current', authMiddleware, async (res, req) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });;
        }

        res.status(200).json({ email: req.user.email, subscription: req.user.subscription });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.patch('/', authMiddleware, async (req, res) => {
    try {
        const { error } = subscriptionSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { subscription } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { subscription },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ email: user.email, subscription: user.subscription });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.patch('/avatars', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "No file uploaded. Please upload an avatar." });
      }

      const { path: tmpPath, filename } = req.file;

      console.log("🔹 req.file:", req.file);
      console.log("🔹 tmpPath should be:", tmpPath);
      console.log(
        "🔹 Does tmpPath exist immediately after upload?",
        fs.existsSync(tmpPath)
      );

      const avatarsDir = path.join(__dirname, "./public/avatars");

      console.log("****avatarsDir:", avatarsDir);

      console.log("🔹🔹🔹 filename:", filename);

      // creates the final path for the image
      const newPath = path.join(avatarsDir, filename);

      console.log("🔹 Temporary file path:", tmpPath);
      console.log("🔹 newPath:", newPath);
      console.log("🔹 Does tmpPath exist?", fs.existsSync(tmpPath));
      console.log("🔹 Does newPath exist before move?", fs.existsSync(newPath));
      console.log(
        "🔹****Checking avatarsDir exists:",
        fs.existsSync(avatarsDir)
      );
      console.log("🔹 ---Attempting to move file from tmpPath to newPath...");

      // processing the avatar
      try {
        const image = await Jimp.read(tmpPath);
        console.log("✅ Image loaded successfully!");
      } catch (error) {
        console.error("❌ Error loading image with Jimp:", error);
      }

      console.log("🔹 +++Attempting to move file from tmpPath to newPath...");

      console.log("🔹 Checking newPath:", newPath);
      console.log("🔹 Does newPath exist before save?", fs.existsSync(newPath));

      // Resize the image to 250x250 pixels and save it to the final directory
      try {
        await image.resize(250, 250).writeAsync(newPath);
        console.log("✅ Image saved successfully at:", newPath);
      } catch (error) {
        console.error("❌ Error saving image, not accessible here:", error);
      }

      console.log("🔹 Does newPath exist after save?", fs.existsSync(newPath));
      console.log("🔹 -+-+-Attempting to move file from tmpPath to newPath...");

      // manually copy the file to the new location
      try {
        await fs.rename(tmpPath, newPath);
        console.log("✅ File moved successfully!");
        console.log("tmpPath:", tmpPath);
        console.log("newPath:", newPath);
      } catch (error) {
        console.error("❌ Error moving file:", error);
      }

      console.log("🔹 Does newPath exist after move?", fs.existsSync(newPath));

      // update the user avatarURL in the database
      const avatarURL = `/avatars/${filename}`;
      await User.findByIdAndUpdate(req.user._id, { avatarURL }, { new: true });

      res.status(200).json({ avatarURL });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get("/verify/:verificationToken", async (req, res) => {
  const { verificationToken } = req.params;

  console.log("🔹 Token received from request:", verificationToken);

  const user = await User.findOne({ verificationToken });

  if (!user) {
    console.log("❌ User not found in DB!");
    return res.status(404).json({ message: "User not found" });
  }

  console.log("✅ User found:", user);

  user.verify = true;
  user.verificationToken = null;
  await user.save();

  // await User.updateOne(
  //   { _id: user._id },
  //   { $set: { verify: true }, $unset: { verificationToken: "" } }
  // );

  console.log("✅ User verified successfully!");

  res.status(200).json({ message: "Verification successful" });
  // res.redirect("http://localhost:3000/login");

}); 

router.post("/verify", resendVerificationEmail);

module.exports = router;
