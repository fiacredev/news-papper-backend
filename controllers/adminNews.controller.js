
import adminNewsService from "../services/adminNews.service.js";

const createArticle = async (req, res, next) => {
  try {
    const article = await adminNewsService.createArticle(
      req.body,
      req.files,
      req.user
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

const getAllArticles = async (req, res, next) => {
  try {
    const result = await adminNewsService.getAllArticles(
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
    const article = await adminNewsService.getArticleById(
      req.params.id,
      req.user
    );

    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    next(error);
  }
};

const updateArticle = async (req, res, next) => {
  try {
    const article = await adminNewsService.updateArticle(
      req.params.id,
      req.body,
      req.files,
      req.user
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
    const result = await adminNewsService.deleteArticle(
      req.params.id,
      req.user
    );

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const publishArticle = async (req, res, next) => {
  try {
    const article = await adminNewsService.publishArticle(
      req.params.id,
      req.user
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

const saveDraft = async (req, res, next) => {
  try {
    const article = await adminNewsService.saveDraft(
      req.params.id,
      req.user
    );

    res.status(200).json({
      success: true,
      message: "Article saved as draft",
      data: article
    });
  } catch (error) {
    next(error);
  }
};

const adminNewsController = {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  publishArticle,
  saveDraft
};

export default adminNewsController;
