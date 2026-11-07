
import newsService from "../services/news.service.js";

const getNews = async (req, res, next) => {
  try {
    const result = await newsService.getPublishedNews(req.query);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getNewsBySlug = async (req, res, next) => {
  try {
    const article = await newsService.getNewsBySlug(req.params.slug);

    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await newsService.getCategories();

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

const newsController = {
  getNews,
  getNewsBySlug,
  getCategories
};

export default newsController;
