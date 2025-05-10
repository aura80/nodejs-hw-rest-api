const Contact = require("./contact");
const mongoose = require("mongoose");

const listContacts = async (filter, page = 1, limit = 20) => {
  try {
    const skip = (page - 1) * limit;
    return await Contact.find(filter).skip(skip).limit(limit);
  } catch (error) {
    throw new Error(`Database error: ${error.message}`)
  }
};

const getById = async (contactId) => {
  try {
    const contact = await Contact.findById(contactId);
    if (!contact) {
      throw new Error(`Contact with id ${contactId} not found!`);
    }
    return contact;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
};

const addContact = async (body) => {
  try {
    return await Contact.create(body);
  } catch (error) {
    throw new Error(`Error adding contact: ${error.message}`);
  }
};

const removeContact = async (contactId) => {
  try {
    const contact = await Contact.findByIdAndDelete(contactId);
    if (!contact) {
      throw new Error(`Contact with id ${contactId} not found!`);
    }
    return contact;
  } catch (error) {
    throw new Error(`Error deleting contact: ${error.message}`);
  }
};

const updateContact = async (contactId, body) => {
  try {
    const updatedContact = await Contact.findByIdAndUpdate(contactId, body, {
      new: true,
      runValidators: true,
    });
    if (!updatedContact) {
      throw new Error(`Contact with id ${contactId} not found!`);
    }
    return updatedContact;
  } catch (error) {
    throw new Error(`Error updating contact: ${error.message}`);
  }
};

const updateContactStatus = async (contactId, body) => {
  try {
    if (!body || typeof body.favorite !== "boolean") {
      throw new Error("missing field favorite");
    }

    const validId = mongoose.Types.ObjectId.isValid(contactId);
    if (!validId) {
      throw new Error("Invalid contact ID format");
    }

    const updatedContact = await Contact.findByIdAndUpdate(contactId, {
      favorite: body.favorite,
    }, {
      new: true,
      runValidators: true,
    });

    if (!updatedContact) {
      throw new Error(`Not found`);
    }

    return updatedContact;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  listContacts,
  getById,
  removeContact,
  addContact,
  updateContact,
  updateContactStatus
};
