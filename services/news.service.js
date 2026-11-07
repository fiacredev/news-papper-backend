
import Article from "../models/article.model.js";

const getPublishedNews = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    category,
    search,
    featured
  } = query;

  const currentPage = Math.max(1, Number(page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(limit) || 10));

  const filter = {
    status: "published",
    publishedAt: { $lte: new Date() }
  };

  if (category) {
    filter.category = category.toLowerCase();
  }

  if (featured === "true") {
    filter.isFeatured = true;
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .populate("author", "name avatar")
      .sort({ publishedAt: -1 })
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

const getNewsBySlug = async (slug) => {
  const article = await Article.findOne({
    slug,
    status: "published",
    publishedAt: { $lte: new Date() }
  })
    .populate("author", "name avatar")
    .lean();

  if (!article) {
    const error = new Error("Article not found");
    error.statusCode = 404;
    throw error;
  }

  return article;
};

const getCategories = async () => {
  return Article.distinct("category", {
    status: "published",
    publishedAt: { $lte: new Date() }
  });
};

const newsService = {
  getPublishedNews,
  getNewsBySlug,
  getCategories
};

export default newsService;
