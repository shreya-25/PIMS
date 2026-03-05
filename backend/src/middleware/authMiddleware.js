const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    // Node/Express normalizes headers to lowercase
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization header missing or invalid",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Expected JWT payload:
    // { userId, role, username, iat, exp }
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Token is invalid or expired",
    });
  }
};

module.exports = verifyToken;