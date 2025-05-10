const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const Joi = require('joi');
const authMiddleware = require('../../middlewares/authMiddleware');

const router = express.Router();

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

router.post('/signup', async (req, res) => {
    try {
        const { error } = signupSchema.validate(req.body);

        if (error) {
            return res
              .status(400)
              .json({ message: "Validation Error", details: error.details[0].message });
        }

        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ message: 'Email in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword });

        res.status(201).json({ user: { email: user.email, subscription: user.subscription } });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

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
}) 

module.exports = router;
