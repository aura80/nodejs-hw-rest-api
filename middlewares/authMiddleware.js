const jwt = require('jsonwebtoken');
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({message: "Not authorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user || user.token !== token) {
            return res.status(401).json({ message: "Not authorized" });;
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ messge: "Not authorized" });
    }
};

module.exports = authMiddleware;
