
import "dotenv/config";

import mongoose from "mongoose";
import User from "../models/user.model.js";

const seedAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    const email = "admin@news.com";

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log("Administrator already exists:", email);
      return;
    }

    const admin = await User.create({
      name: "System Administrator",
      email,
      password: "ChangeThisPassword123!",
      role: "admin",
      isActive: true
    });

    console.log("Administrator created successfully");
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);

  } catch (error) {
    console.error("Administrator seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();
