const express = require('express');
const {
  listContacts,
  getById,
  addContact,
  removeContact,
  updateContact,
  updateContactStatus,
} = require("../../models/contacts");

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

router.get("/", async (req, res, next) => {
  try {
    const contacts = await listContacts();
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const contact = await getById(contactId);

    if (!contact) {
      return res.status(404).json({ message: "Not found!" });
    }

    res.status(200).json(contact);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { error } = contactSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const newContact = await addContact(req.body);
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

router.delete("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const removedContact = await removeContact(contactId);

    if (!removedContact) {
      return res.status(404).json({ message: "Not found" });
    }

    res.status(200).json({ message: "Contact deleted" });
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;

    const { error } = contactSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updatedContact = await updateContact(contactId, req.body);

    if (!updatedContact) {
      return res.status(404).json({ message: "Not found!" });
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
});

router.patch("/:contactId/favorite", async (req, res, next) => {
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

    const updatedContact = await updateContactStatus(contactId, req.body);

    if (!updatedContact) {
      return res.status(404).json({ message: "Not found" });
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
