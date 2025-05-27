const User = require("../models/userModel");

const getAllUsernames = async (req, res) => {
  try {
    // Fetch only the username field from each user document.
     const users = await User.find()
                            .select('-password -__v');
    // Map the result to an array of usernames.
    // const usernames = users.map(user => user.username);
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { getAllUsernames };
