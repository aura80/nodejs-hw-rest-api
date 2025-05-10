const express = require('express');
const authMiddleware = require('../../middlewares/authMiddleware');
const {
  listContacts,
  getById,
  addContact,
  removeContact,
  updateContact,
  updateContactStatus,
} = require("../../models/contacts");
const Contact = require("../../models/contact");

const router = express.Router();

const Joi = require("joi");

const contactSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    "any.required": "missing required name field",
    "string.min": "Name should have at least 3 characters",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "missing required email field",
    "string.email": "Email must be a valid email address",
  }),
  phone: Joi.string()
    .pattern(/^\(\d{3}\)\s\d{3}-\d{5}$/)
    .required()
    .messages({
      "any.required": "missing required phone field",
      "string.pattern.base": "Phone must be in the format (123) 841-55234",
    }),
  favorite: Joi.boolean().required().messages({
    "any.required": "missing field favorite",
    "boolean.base": "favorite must be true or false",
  }),
});

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, favorite } = req.query;
    
    const filter = { owner: req.user._id };
    if (favorite !== undefined) {
      filter.favorite = favorite === "true";
    }

    const contacts = await listContacts(filter, Number(page), Number(limit));
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", authMiddleware, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const contact = await getById(contactId);

    // using .toString() to avoid comparing ObjectId's
    // req.user._id extracted from JWT token
    // contact.owner extracted from DB
    if (!contact || contact.owner.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Not found!" });
    }

    res.status(200).json(contact);
  } catch (error) {
    next(error);
  }
});

router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { error } = contactSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const newContact = await addContact({ ...req.body, owner: req.user._id });
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

router.delete("/:contactId", authMiddleware, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const removedContact = await removeContact(contactId);

    if (!removedContact || removedContact.owner.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Not found" });
    }

    res.status(200).json({ message: "Contact deleted" });
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", authMiddleware, async (req, res, next) => {
  try {
    const { contactId } = req.params;

    const { error } = contactSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updatedContact = await updateContact(contactId, { ...req.body, owner: req.user._id });

    if (!updatedContact) {
      return res.status(404).json({ message: "Not found!" });
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
});

router.patch("/:contactId/favorite", authMiddleware, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    console.log("Received contactId:", contactId);
    const { error } = Joi.object({
      favorite: Joi.boolean().required().messages({
        "any.required": "missing field favorite",
        "boolean.base": "favorite must be true or false",
      }),
    }).validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const contact = await Contact.findById(contactId);
    // check to see if contact from DB is the same as the one from the token
    if (!contact || contact.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden: You do not own this contact" });
    }

    const updatedContact = await updateContactStatus(contactId, { ...req.body, owner: req.user._id });

    if (!updatedContact) {
      return res.status(404).json({ message: "Not found" });
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
