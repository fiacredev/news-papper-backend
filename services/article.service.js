
import Article from "../models/article.model.js";
import AppError from "../utils/AppError.js";

const canManageArticle = (user, article) => {
  return (
    user.role === "admin" ||
    article.author.toString() === user._id.toString()
  );
};

// Get all articles with pagination, search and filters
const getArticles = async (user, query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    status,
    featured,
    author,
    sort = "-createdAt"
  } = query;

  const currentPage = Math.max(1, Number(page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(limit) || 10));

  const filter = {};

  // Journalists can only see their own articles.
  // Admins can see all articles.
  if (user.role === "journalist") {
    filter.author = user._id;
  } else if (user.role === "admin" && author) {
    filter.author = author;
  }

  // Search
  if (search?.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { excerpt: { $regex: search.trim(), $options: "i" } }
    ];
  }

  if (category) {
    filter.category = category.toLowerCase();
  }

  if (status) {
    filter.status = status;
  }

  if (featured !== undefined) {
    filter.isFeatured = featured === "true";
  }

  // Only permit known sorting fields.
  const allowedSorts = [
    "-createdAt",
    "createdAt",
    "-publishedAt",
    "publishedAt",
    "-views",
    "views",
    "title",
    "-title"
  ];

  const safeSort = allowedSorts.includes(sort)
    ? sort
    : "-createdAt";

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .populate("author", "name email role avatar")
      .sort(safeSort)
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .lean(),

    Article.countDocuments(filter)
  ]);

  return {
    articles,
    pagination: {
      total,
      page: currentPage,
      limit: perPage,
      totalPages: Math.ceil(total / perPage)
    }
  };
};

// Get article by ID
const getArticleById = async (user, id) => {
  const article = await Article.findById(id)
    .populate("author", "name email");

  if (!article) {
    throw new AppError("Article not found", 404);
  }

  if (!canManageArticle(user, article)) {
    throw new AppError("You are not authorized to view this article", 403);
  }

  return article;
};

// Create article
const createArticle = async (user, data) => {
  const article = await Article.create({
    ...data,
    author: user.id
  });

  return article;
};

// Update article
const updateArticle = async (user, id, data) => {
  const article = await Article.findById(id);

  if (!article) {
    throw new AppError("Article not found", 404);
  }

  // Only the author can update their article
if (!canManageArticle(user, article)) {
  throw new AppError("You are not authorized to update this article", 403);
}

  const updatedArticle = await Article.findByIdAndUpdate(
    id,
    { $set: data },
    {
      new: true,
      runValidators: true
    }
  ).populate("author", "name email");

  return updatedArticle;
};

// Delete article
const deleteArticle = async (user, id) => {
  const article = await Article.findById(id);

  if (!article) {
    throw new AppError("Article not found", 404);
  }

  if (!canManageArticle(user, article)) {
    throw new AppError("You are not authorized to delete this article", 403);
  }

  await article.deleteOne();

  return true;
};

// Publish article
const publishArticle = async (id) => {
  const article = await Article.findById(id);

  if (!article) {
    throw new AppError("Article not found", 404);
  }

  article.status = "published";
  article.publishedAt = new Date();

  await article.save();

  return article;
};

// Archive article
const archiveArticle = async (id) => {
  const article = await Article.findById(id);

  if (!article) {
    throw new AppError("Article not found", 404);
  }

  article.status = "archived";

  await article.save();

  return article;
};

// Toggle featured status
const toggleFeatured = async (id) => {
  const article = await Article.findById(id);

  if (!article) {
    throw new AppError("Article not found", 404);
  }

  article.isFeatured = !article.isFeatured;

  await article.save();

  return article;
};

export default {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  archiveArticle,
  toggleFeatured
};
