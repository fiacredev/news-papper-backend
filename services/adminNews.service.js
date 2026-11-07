
import Article from "../models/article.model.js";
import uploadService from "./upload.service.js";
import sanitizeHtml from "sanitize-html";

const sanitizeContent = (content) => {
  return sanitizeHtml(content || "", {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "figure",
      "figcaption"
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "width", "height"],
      a: ["href", "target", "rel"]
    },
    allowedSchemes: ["http", "https", "mailto"]
  });
};

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const getUniqueSlug = async (title, excludeId = null) => {
  const baseSlug = generateSlug(title);
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

const parseTags = (tags) => {
  if (!tags) return [];

  const values = Array.isArray(tags)
    ? tags
    : tags.split(",");

  return [...new Set(
    values.map(tag => tag.trim().toLowerCase()).filter(Boolean)
  )];
};


const uploadFiles = async (files = {}) => {
  const uploaded = {
    featuredImage: null,
    images: []
  };

  try {
    if (files.featuredImage?.[0]) {
      uploaded.featuredImage = await uploadService.uploadImage(
        files.featuredImage[0].buffer
      );
    }

    for (const file of files.images || []) {
      const image = await uploadService.uploadImage(file.buffer);
      uploaded.images.push(image);
    }

    return uploaded;
  } catch (error) {
    const allImages = [
      uploaded.featuredImage,
      ...uploaded.images
    ].filter(Boolean);

    await Promise.allSettled(
      allImages.map(image =>
        uploadService.deleteImage(image.publicId)
      )
    );

    throw error;
  }
};


const checkOwnership = (article, user) => {
  const authorId = article.author?._id || article.author;

  if (article.status === "published" && user.role !== "admin") {
    const error = new Error(
      "Only administrators can delete published articles"
    );

    error.statusCode = 403;
    throw error;
  }
};

// CREATE ARTICLE
const createArticle = async (body, files, user) => {
  const uploaded = await uploadFiles(files);

  try {
    const slug = await getUniqueSlug(body.title);

    const article = await Article.create({
      title: body.title,
      slug,
      excerpt: body.excerpt,
      content: sanitizeContent(body.content),
      category: body.category,
      tags: parseTags(body.tags),
      author: user._id,
      status: "draft",
      source: "original",
      featuredImage: uploaded.featuredImage,
      images: uploaded.images,
      seo: {
        metaTitle: body.metaTitle || body.title,
        metaDescription: body.metaDescription || body.excerpt
      }
    });

    return article;
  } catch (error) {
    const images = [
      uploaded.featuredImage,
      ...uploaded.images
    ].filter(Boolean);

    await Promise.allSettled(
      images.map(image =>
        uploadService.deleteImage(image.publicId)
      )
    );

    throw error;
  }
};

// GET ALL ADMIN ARTICLES
const getAllArticles = async (user, filters = {}) => {
  const query = {};

  if (user.role !== "admin") {
    query.author = user._id;
  }

  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;

  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(filters.limit) || 10));

  const [articles, total] = await Promise.all([
    Article.find(query)
      .populate("author", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),

    Article.countDocuments(query)
  ]);

  return {
    articles,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// GET SINGLE ARTICLE
const getArticleById = async (id, user) => {
  const article = await Article.findById(id)
    .populate("author", "name email role");

  if (!article) {
    const error = new Error("Article not found");
    error.statusCode = 404;
    throw error;
  }

  checkOwnership(article, user);

  return article;
};

// UPDATE ARTICLE
const updateArticle = async (id, body, files, user) => {
  const article = await Article.findById(id);

  if (!article) {
    const error = new Error("Article not found");
    error.statusCode = 404;
    throw error;
  }

  checkOwnership(article, user);

  if (article.status === "published" && user.role !== "admin") {
    const error = new Error("Journalists cannot edit published articles");
    error.statusCode = 403;
    throw error;
  }

  const uploaded = await uploadFiles(files);
  const oldImages = [];

  try {
    if (body.title && body.title !== article.title) {
      article.title = body.title;
      article.slug = await getUniqueSlug(body.title, article._id);
    }

    if (body.excerpt !== undefined) article.excerpt = body.excerpt;

    if (body.content !== undefined) {
      article.content = sanitizeContent(body.content);
    }

    if (body.category !== undefined) article.category = body.category;
    if (body.tags !== undefined) article.tags = parseTags(body.tags);

    if (body.metaTitle !== undefined) {
      article.seo.metaTitle = body.metaTitle;
    }

    if (body.metaDescription !== undefined) {
      article.seo.metaDescription = body.metaDescription;
    }

    if (uploaded.featuredImage) {
      if (article.featuredImage?.publicId) {
        oldImages.push(article.featuredImage.publicId);
      }

      article.featuredImage = uploaded.featuredImage;
    }

    if (uploaded.images.length) {
      article.images.push(...uploaded.images);
    }

    const updatedArticle = await article.save();

    await Promise.allSettled(
      oldImages.map(id => uploadService.deleteImage(id))
    );

    return updatedArticle;
  } catch (error) {
    const newImages = [
      uploaded.featuredImage,
      ...uploaded.images
    ].filter(Boolean);

    await Promise.allSettled(
      newImages.map(image =>
        uploadService.deleteImage(image.publicId)
      )
    );

    throw error;
  }
};

// DELETE ARTICLE
const deleteArticle = async (id, user) => {
  const article = await Article.findById(id);

  if (!article) {
    const error = new Error("Article not found");
    error.statusCode = 404;
    throw error;
  }

  checkOwnership(article, user);

  const imageIds = [
    article.featuredImage?.publicId,
    ...article.images.map(image => image.publicId)
  ].filter(Boolean);

  await article.deleteOne();

  await Promise.allSettled(
    imageIds.map(id => uploadService.deleteImage(id))
  );

  return { message: "Article deleted successfully" };
};

// PUBLISH ARTICLE (ADMIN ONLY)
const publishArticle = async (id, user) => {
  if (user.role !== "admin") {
    const error = new Error("Only administrators can publish articles");
    error.statusCode = 403;
    throw error;
  }

  const article = await Article.findById(id);

  if (!article) {
    const error = new Error("Article not found");
    error.statusCode = 404;
    throw error;
  }

  article.status = "published";
  article.publishedAt = new Date();

  return article.save();
};

// SAVE AS DRAFT
const saveDraft = async (id, user) => {
  const article = await Article.findById(id);

  if (!article) {
    const error = new Error("Article not found");
    error.statusCode = 404;
    throw error;
  }

  checkOwnership(article, user);

  if (article.status === "published" && user.role !== "admin") {
    const error = new Error("Only administrators can unpublish articles");
    error.statusCode = 403;
    throw error;
  }

  article.status = "draft";
  article.publishedAt = null;

  return article.save();
};

const adminNewsService = {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  publishArticle,
  saveDraft
};

export default adminNewsService;
