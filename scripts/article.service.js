import mongoose from "mongoose";
import Article from "../models/article.model.js";

const categories = [
  "general",
  "politics",
  "sports",
  "business",
  "technology",
  "health",
  "science",
  "entertainment"
];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError("Invalid article ID", 400);
  }
};

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const createUniqueSlug = async (title, excludeId = null) => {
  const baseSlug = generateSlug(title);

  if (!baseSlug) {
    throw createError("A valid article title is required", 400);
  }

  let slug = baseSlug;
  let counter = 1;

  while (
    await Article.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {})
    })
  ) {
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

const getArticleForUser = async (user, id) => {
  validateId(id);

  const article = await Article.findById(id);

  if (!article) {
    throw createError("Article not found", 404);
  }

  if (
    user.role !== "admin" &&
    article.author.toString() !== user._id.toString()
  ) {
    throw createError("You do not have permission to access this article", 403);
  }

  return article;
};

// LIST ARTICLES
const getArticles = async (user, query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    status,
    sort = "newest"
  } = query;

  const currentPage = Math.max(1, Number(page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(limit) || 10));

  const filter = {};

  // Journalists only see their own articles.
  if (user.role !== "admin") {
    filter.author = user._id;
  }

  if (category && categories.includes(category.toLowerCase())) {
    filter.category = category.toLowerCase();
  }

  if (status && ["draft", "published", "archived"].includes(status)) {
    filter.status = status;
  }

  if (search?.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    popular: { views: -1 },
    updated: { updatedAt: -1 }
  };

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .populate("author", "name email avatar")
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .lean(),

    Article.countDocuments(filter)
  ]);

  return {
    data: articles,
    pagination: {
      total,
      page: currentPage,
      limit: perPage,
      totalPages: Math.ceil(total / perPage)
    }
  };
};

// GET SINGLE ARTICLE
const getArticleById = async (user, id) => {
  const article = await getArticleForUser(user, id);

  return article;
};

// CREATE ARTICLE
const createArticle = async (user, data) => {
  const {
    title,
    excerpt,
    content,
    category,
    tags,
    featuredImage,
    images,
    source,
    sourceUrl,
    seo
  } = data;

  if (!title || title.trim().length < 5) {
    throw createError("Title must contain at least 5 characters", 400);
  }

  if (!excerpt || excerpt.trim().length === 0) {
    throw createError("Article excerpt is required", 400);
  }

  if (!content || !content.trim()) {
    throw createError("Article content is required", 400);
  }

  if (!categories.includes(category?.toLowerCase())) {
    throw createError("Invalid article category", 400);
  }

  if (
    source &&
    !["original", "external"].includes(source)
  ) {
    throw createError("Invalid article source", 400);
  }

  if (source === "external" && !sourceUrl) {
    throw createError("Source URL is required for external articles", 400);
  }

  const slug = await createUniqueSlug(title);

  const article = await Article.create({
    title: title.trim(),
    slug,
    excerpt: excerpt.trim(),
    content,
    category: category.toLowerCase(),
    tags: tags || [],
    featuredImage: featuredImage || null,
    images: images || [],
    source: source || "original",
    sourceUrl: sourceUrl || null,
    seo: seo || {},
    author: user._id,

    // New articles always begin as drafts.
    status: "draft",
    publishedAt: null,

    // Only admins can feature articles.
    isFeatured: false
  });

  return article;
};

// UPDATE ARTICLE
const updateArticle = async (user, id, data) => {
  const article = await getArticleForUser(user, id);

  if (user.role !== "admin" && article.status !== "draft") {
    throw createError(
      "Journalists can only edit their own draft articles",
      403
    );
  }

  const allowedFields = [
    "title",
    "excerpt",
    "content",
    "category",
    "tags",
    "featuredImage",
    "images",
    "source",
    "sourceUrl",
    "seo"
  ];

  const updates = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  }

  if (updates.title !== undefined) {
    if (
      typeof updates.title !== "string" ||
      updates.title.trim().length < 5
    ) {
      throw createError("Title must contain at least 5 characters", 400);
    }

    updates.title = updates.title.trim();
    updates.slug = await createUniqueSlug(updates.title, id);
  }

  if (updates.category !== undefined) {
    updates.category = updates.category.toLowerCase();

    if (!categories.includes(updates.category)) {
      throw createError("Invalid article category", 400);
    }
  }

  if (updates.excerpt !== undefined) {
    if (
      typeof updates.excerpt !== "string" ||
      !updates.excerpt.trim()
    ) {
      throw createError("Article excerpt is required", 400);
    }

    updates.excerpt = updates.excerpt.trim();
  }

  if (updates.content !== undefined) {
    if (
      typeof updates.content !== "string" ||
      !updates.content.trim()
    ) {
      throw createError("Article content is required", 400);
    }
  }

  if (updates.source !== undefined) {
    if (!["original", "external"].includes(updates.source)) {
      throw createError("Invalid article source", 400);
    }
  }

  if (
    (updates.source === "external" ||
      (!updates.source && article.source === "external")) &&
    !(updates.sourceUrl || article.sourceUrl)
  ) {
    throw createError("Source URL is required for external articles", 400);
  }

  Object.assign(article, updates);

  await article.save();

  return article;
};

// DELETE ARTICLE
const deleteArticle = async (user, id) => {
  const article = await getArticleForUser(user, id);

  if (user.role !== "admin" && article.status !== "draft") {
    throw createError(
      "Journalists can only delete their own draft articles",
      403
    );
  }

  await article.deleteOne();

  return true;
};

// PUBLISH ARTICLE (ADMIN ONLY)
const publishArticle = async (id) => {
  validateId(id);

  const article = await Article.findById(id);

  if (!article) {
    throw createError("Article not found", 404);
  }

  article.status = "published";
  article.publishedAt = new Date();

  await article.save();

  return article;
};

// ARCHIVE ARTICLE (ADMIN ONLY)
const archiveArticle = async (id) => {
  validateId(id);

  const article = await Article.findById(id);

  if (!article) {
    throw createError("Article not found", 404);
  }

  article.status = "archived";
  article.isFeatured = false;

  await article.save();

  return article;
};

// TOGGLE FEATURED STATUS (ADMIN ONLY)
const toggleFeatured = async (id) => {
  validateId(id);

  const article = await Article.findById(id);

  if (!article) {
    throw createError("Article not found", 404);
  }

  if (article.status !== "published") {
    throw createError("Only published articles can be featured", 400);
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