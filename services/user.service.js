import mongoose from "mongoose";
import User from "../models/user.model.js";
import Article from "../models/article.model.js";

const error = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const validateId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw error("Invalid user ID", 400);
  }
};

const getJournalists = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));

  const filter = { role: "journalist" };

  if (query.search?.trim()) {
    const search = query.search.trim();

    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  if (query.status === "active") filter.isActive = true;
  if (query.status === "inactive") filter.isActive = false;

  const [journalists, total] = await Promise.all([
    User.find(filter)
      .select("name email avatar isActive lastLogin createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    User.countDocuments(filter)
  ]);

  return {
    data: journalists,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getJournalistById = async (id) => {
  validateId(id);

  const journalist = await User.findOne({
    _id: id,
    role: "journalist"
  }).select("name email avatar isActive lastLogin createdAt");

  if (!journalist) {
    throw error("Journalist not found", 404);
  }

  const [totalArticles, publishedArticles, draftArticles] =
    await Promise.all([
      Article.countDocuments({ author: id }),
      Article.countDocuments({ author: id, status: "published" }),
      Article.countDocuments({ author: id, status: "draft" })
    ]);

  return {
    journalist,
    statistics: {
      totalArticles,
      publishedArticles,
      draftArticles
    }
  };
};

const updateJournalist = async (id, data) => {
  validateId(id);

  const journalist = await User.findOne({
    _id: id,
    role: "journalist"
  });

  if (!journalist) {
    throw error("Journalist not found", 404);
  }

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim().length < 2) {
      throw error("Name must contain at least 2 characters", 400);
    }

    journalist.name = data.name.trim();
  }

  if (data.email !== undefined) {
    const email = data.email.toLowerCase().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw error("Invalid email address", 400);
    }

    const existing = await User.findOne({
      email,
      _id: { $ne: id }
    });

    if (existing) {
      throw error("Email is already registered", 409);
    }

    journalist.email = email;
  }

  await journalist.save();

  return {
    id: journalist._id,
    name: journalist.name,
    email: journalist.email,
    role: journalist.role,
    isActive: journalist.isActive
  };
};

const toggleJournalistStatus = async (id) => {
  validateId(id);

  const journalist = await User.findOne({
    _id: id,
    role: "journalist"
  });

  if (!journalist) {
    throw error("Journalist not found", 404);
  }

  journalist.isActive = !journalist.isActive;
  await journalist.save();

  return journalist;
};

const deleteJournalist = async (id) => {
  validateId(id);

  const journalist = await User.findOne({
    _id: id,
    role: "journalist"
  });

  if (!journalist) {
    throw error("Journalist not found", 404);
  }

  // Preserve articles and their authorship.
  // Only remove the account.
  await journalist.deleteOne();

  return true;
};

export default {
  getJournalists,
  getJournalistById,
  updateJournalist,
  toggleJournalistStatus,
  deleteJournalist
};