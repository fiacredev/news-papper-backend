
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import { env } from "../config/env.js";

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
};

// Register journalist (admin only)
const createJournalist = async (data) => {
  const existingUser = await User.findOne({
    email: data.email.toLowerCase()
  });

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    password: data.password,
    role: "journalist"
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
};

// Login
const login = async (email, password) => {
  const user = await User.findOne({
    email: email.toLowerCase()
  }).select("+password");

  if (!user || !user.isActive) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  user.lastLogin = new Date();
  await user.save();

  return {
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

// Current authenticated user
const getProfile = async (userId) => {
  const user = await User.findById(userId).select(
    "name email role avatar isActive lastLogin createdAt"
  );

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const authService = {
  createJournalist,
  login,
  getProfile
};

export default authService;
