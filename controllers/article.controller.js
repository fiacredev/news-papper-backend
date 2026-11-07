import articleService from "../services/article.service.js";

const getArticles = async (req, res, next) => {
  try {
    const result = await articleService.getArticles(
      req.user,
      req.query
    );

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getArticleById = async (req, res, next) => {
  try {
    const article = await articleService.getArticleById(
      req.user,
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    next(error);
  }
};

const createArticle = async (req, res, next) => {
  try {
    const article = await articleService.createArticle(
      req.user,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Article created successfully",
      data: article
    });
  } catch (error) {
    next(error);
  }
};

const updateArticle = async (req, res, next) => {
  try {
    const article = await articleService.updateArticle(
      req.user,
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Article updated successfully",
      data: article
    });
  } catch (error) {
    next(error);
  }
};

const deleteArticle = async (req, res, next) => {
  try {
    await articleService.deleteArticle(
      req.user,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Article deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

const publishArticle = async (req, res, next) => {
  try {
    const article = await articleService.publishArticle(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Article published successfully",
      data: article
    });
  } catch (error) {
    next(error);
  }
};

const archiveArticle = async (req, res, next) => {
  try {
    const article = await articleService.archiveArticle(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Article archived successfully",
      data: article
    });
  } catch (error) {
    next(error);
  }
};

const toggleFeatured = async (req, res, next) => {
  try {
    const article = await articleService.toggleFeatured(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Featured status updated",
      data: article
    });
  } catch (error) {
    next(error);
  }
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