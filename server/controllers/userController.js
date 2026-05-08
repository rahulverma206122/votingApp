const bcrypt        = require('bcryptjs');
const User          = require('../models/user');
const { generateToken } = require('../middleware/auth');

// ─── SIGNUP ───────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const data = req.body;

    const requiredFields = ['name', 'age', 'address', 'aadharCardNumber', 'password'];
    for (let field of requiredFields) {
      if (!data[field]) {
        return res.status(400).json({
          success : false,
          error   : `${field} is required`,
        });
      }
    }

    if (!/^\d{12}$/.test(data.aadharCardNumber)) {
      return res.status(400).json({
        success : false,
        error   : 'Aadhar Card Number must be exactly 12 digits',
      });
    }

    const existingUser = await User.findOne({ aadharCardNumber: data.aadharCardNumber });
    if (existingUser) {
      return res.status(400).json({
        success : false,
        error   : 'User with this Aadhar already exists',
      });
    }

    if (data.role === 'admin') {
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        return res.status(400).json({
          success : false,
          error   : 'Admin user already exists',
        });
      }
    }

    const salt    = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);

    const newUser  = new User(data);
    const response = await newUser.save();
    const token    = generateToken({ id: response.id });

    res.status(201).json({
      success : true,
      message : 'User registered successfully',
      user    : { id: response.id, name: response.name, role: response.role },
      token,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// ─── LOGIN ────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { aadharCardNumber, password } = req.body;

    if (!aadharCardNumber || !password) {
      return res.status(400).json({
        success : false,
        error   : 'Aadhar Card Number and password are required',
      });
    }

    const user = await User.findOne({ aadharCardNumber });
    if (!user) {
      return res.status(404).json({
        success : false,
        error   : 'User not found',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success : false,
        error   : 'Invalid Aadhar or Password',
      });
    }

    const token = generateToken({ id: user.id });

    res.status(200).json({
      success : true,
      message : 'Login successful',
      token,
      user    : { id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// ─── GET PROFILE ──────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success : false,
        error   : 'User not found',
      });
    }

    res.status(200).json({
      success : true,
      user,
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// ─── UPDATE PASSWORD ──────────────────────────────────────
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success : false,
        error   : 'Both current and new passwords are required',
      });
    }

    const user    = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success : false,
        error   : 'Invalid current password',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      success : true,
      message : 'Password updated successfully',
    });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// ─── EXPORTS ──────────────────────────────────────────────
module.exports = {
  signup,
  login,
  getProfile,
  updatePassword,
};