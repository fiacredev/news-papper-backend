
import "dotenv/config";

import mongoose from "mongoose";
import User from "../models/user.model.js";

const createAdmin = async () => {
  try {
    const { MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } =
      process.env;

    if (!MONGODB_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Missing administrator setup environment variables");
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error("Admin password must contain at least 12 characters");
    }

    await mongoose.connect(MONGODB_URI);

    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      throw new Error("An administrator account already exists");
    }

    const existingEmail = await User.findOne({
      email: ADMIN_EMAIL.toLowerCase()
    });

    if (existingEmail) {
      throw new Error("This email is already registered");
    }

    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      password: ADMIN_PASSWORD,
      role: "admin"
    });

    console.log("Administrator created successfully:", admin.email);
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
