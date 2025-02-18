const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    let token;
    const authHeader = req.headers.Authorization || req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1]; // Correct split method
        console.log("✅ Extracted Token:", token);

        if (!token) {
            return res.status(401).json({ message: "No token, Authorization Denied" });
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
            console.log("✅ Token Decoded Successfully:", decoded);
            req.user = decoded; // Attach decoded data to request object
            console.log("Decoded User:", req.user);
            next(); // Pass control to the next middleware
        } catch (err) {
            return res.status(400).json({ message: "Token is not valid" });
        }
    } else {
        return res.status(401).json({ message: "Authorization header is missing or invalid" });
    }
};

module.exports = verifyToken;
