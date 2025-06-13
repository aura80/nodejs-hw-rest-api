// For generating a secret key directly from the terminal:
//node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

require("dotenv").config();
const app = require("./app");
const mongoose = require("mongoose");

mongoose.set("strictQuery", true);  // to suppress mongoose warning

// const db_url = "mongodb+srv://auradragan80:test@cluster0.0i5ioj4.mongodb.net/";
const db_url = "mongodb+srv://auradragan80:test@cluster0.0i5ioj4.mongodb.net/db-contacts?retryWrites=true&w=majority";

const connectToMongoDB = async () => {
  try {
    mongoose.connect(db_url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4
    });
    console.log("MongoDB connection successful");

    app.listen(3000, () => {
      console.log("Server is running. Use our API on port: 3000");
    });
  } catch (error) {
    console.error("MongoDB connection failed: ", error);
    process.exit(1);
  }
}

const User = require("./models/user");

async function deleteUser(email) {
  await User.deleteOne({ email });
  console.log(`✅ Deleted user with email: ${email}`);
}

// deleteUser("auramariadragan@gmail.com");

async function testUserCreation() {
  const testUser = await User.create({
    email: "testuser@mail.com",
    password: "password123",
    verificationToken: "test-token",
  });
  console.log("✅ Test User Created:", testUser);
}

// testUserCreation();

mongoose.connection.on("connected", async () => {
  console.log("🔹 Active DB:", mongoose.connection.db.databaseName);
});

const {
  listContacts,
} = require("./models/contacts");

const testListContacts = async () => {
  const filter = {}; // ✅ Elimină filtrarea pentru test
  const contacts = await listContacts(filter, 1, 20);
  console.log("🔹 Test contacts from DB:", contacts);
};

// testListContacts();

const Contact = require("./models/contact");

async function addTestContact() {
  const newContact = await Contact.create({
    name: "John Doe",
    email: "john.doe@mail.com",
    phone: "123456789",
    owner: new mongoose.Types.ObjectId("6833307a710f7341d2425e6e"),
  });

  // console.log("✅ Contact Added:", newContact);
}

// addTestContact();


connectToMongoDB();
