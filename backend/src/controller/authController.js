const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const register = async (req, res) => {
    try{
    const { firstName, lastName, username, password, role, email} = req.body;

    if (!username || !password || !role || !email) {
      return res.status(400).json({ message: "username, password, role & email are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({firstName,
      lastName,
      username,
      password: hashedPassword,
      role,
      email,});
    await newUser.save();
    res.status(201).json({message: `User registered with username ${ username}`});
    } catch (err) {
    res.status(500).json({message: `Something went wrong`});
    }

};

const login = async (req, res) => {

    try{
    const {username, password} = req.body;
    const user = await User.findOne({username });
    if(!user){
        return res.status(404).json({message: `User with ${username} not found`})
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        return res.status(400).json({message: `Invalid Credentials`})
    }
    const token = jwt.sign({id: user._id, name: user.username, role: user.role}, process.env.JWT_SECRET, {expiresIn: "1h"});
    res.status(200).json({ token, id: user._id,
        firstName: user.firstName,
        lastName: user.lastName, role: user.role, name: user.username });

    }
    catch (err) {
        res.status(500).json({message: `Something went wrong`});
        }


};

module.exports = 
{
    register,
    login,
};