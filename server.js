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

connectToMongoDB();
