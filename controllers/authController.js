import User from "../models/User.js";
import bcrypt from "bcryptjs";
import validator from "validator";
import generateToken from "../utils/generateToken.js";

/**
 * @desc Register User
 * @route POST /api/auth/register
 * @access Public
 */
export const registerUser = async (req, res) => {
    try {

        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        // Check existing user
        const existingUser = await User.findOne({
            email
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "user"
        });

        // JWT
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: "Registration Successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


/**
 * @desc Login User
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Email and Password are required"
            });

        }

        const user = await User.findOne({
            email
        });

        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Invalid Credentials"
            });

        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {

            return res.status(401).json({
                success: false,
                message: "Invalid Credentials"
            });

        }

        const token = generateToken(user._id);

        res.status(200).json({

            success: true,
            message: "Login Successful",

            token,

            user: {

                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role

            }

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};


/**
 * @desc Get User Profile
 * @route GET /api/auth/profile
 * @access Private
 */
export const getProfile = async (req, res) => {

    try {

        const user = await User.findById(req.user._id).select("-password");

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        res.status(200).json({

            success: true,
            user

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};


/**
 * @desc Update Profile
 * @route PUT /api/auth/profile
 * @access Private
 */
export const updateProfile = async (req, res) => {

    try {

        const { name, email } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        user.name = name || user.name;
        user.email = email || user.email;

        await user.save();

        res.status(200).json({

            success: true,
            message: "Profile Updated Successfully",

            user: {

                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role

            }

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};


/**
 * @desc Change Password
 * @route PUT /api/auth/change-password
 * @access Private
 */
export const changePassword = async (req, res) => {

    try {

        const {

            currentPassword,
            newPassword

        } = req.body;

        if (!currentPassword || !newPassword) {

            return res.status(400).json({

                success: false,
                message: "All fields are required"

            });

        }

        const user = await User.findById(req.user._id);

        const isMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isMatch) {

            return res.status(401).json({

                success: false,
                message: "Current password is incorrect"

            });

        }

        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.status(200).json({

            success: true,
            message: "Password Updated Successfully"

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};


/**
 * @desc Logout User
 * @route POST /api/auth/logout
 * @access Private
 */
export const logoutUser = async (req, res) => {

    try {

        res.status(200).json({

            success: true,
            message: "Logout Successful"

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};