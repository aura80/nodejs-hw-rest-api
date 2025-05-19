const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

mongoose.set("strictQuery", true);

describe('User Authentication - Login', () => {
    beforeAll(async () => {
        require("dotenv").config({ path: ".env.test" });

        console.log("🔹 DB_TEST_URL value:", process.env.DB_TEST_URL);

        mongoose.connect(process.env.DB_TEST_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });

        await User.deleteMany({ email: "test@mail.com" });

        const hashedPassword = await bcrypt.hash("password123", 10);

        await User.create({ email: "test@mail.com", password: hashedPassword, subscription: "starter" });
    });

    afterAll(async () => {
        // await mongoose.connection.close();
        await mongoose.disconnect();
    });

    it('it should return status code 200 and a valid token on successful login', async () => {
        const response = await request(app).post("/api/users/login").send({
            email: "test@mail.com",
            password: "password123"
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
    });

    it('it should return user object with email and subscription', async () => {
        const response = await request(app).post("/api/users/login").send({
            email: "test@mail.com",
            password: "password123",
        });

        expect(response.body).toHaveProperty("user");
        expect(response.body.user).toHaveProperty("email");
        expect(response.body.user).toHaveProperty("subscription");
        expect(typeof response.body.user.email).toBe("string");
        expect(typeof response.body.user.subscription).toBe("string");
    });

    it('it should return status code 401 for invalid credentials', async () => {
        const response = await request(app).post("/api/users/login").send({
            email: "wrong@mail.com",
            password: "wrongpassword"
        });

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty(
          "message",
          "Email or password is wrong"
        );
    });

});