const fs = require('fs/promises');
const path = require('path');

const contactsPath = path.join(__dirname, 'contacts.json');

const listContacts = async () => {
  const data = await fs.readFile(contactsPath, 'utf8');

  return JSON.parse(data);
}

const getById = async (contactId) => {
  const contacts = await listContacts();
  const contact = contacts.find(contact => contact.id === contactId);

  if (!contact) {
    throw new Error(`Contact with id ${contactId} not found!`);
  }

  return contact;
}

const removeContact = async (contactId) => {
  const contacts = await listContacts();
  const index = contacts.findIndex((contact) => contact.id === contactId);
  
  if (index === -1) {
    throw new Error(`Contact with id ${ contactId } not found!`);
  }

  const [removedContact] = contacts.splice(index, 1);
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  
  return removedContact;
}

const addContact = async (body) => {
  const contacts = await listContacts();
  const newContact = {
    id: Date.now().toString(),
    ...body
  };
  
  contacts.push(newContact);
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  
  return newContact;
} 

const updateContact = async (contactId, body) => {
  const contacts = await listContacts();
  const index = contacts.findIndex(contact => contact.id === contactId);

  if (index === -1) {
    throw new Error(`Contact with id ${contactId} not found!`);
  }

  const updatedContact = { ...contacts[index], ...body };
  contacts[index] = updatedContact;

  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));

  return updatedContact;
}

module.exports = {
  listContacts,
  getById,
  removeContact,
  addContact,
  updateContact,
}
