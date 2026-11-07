import userService from "../services/user.service.js";

const getJournalists = async (req, res, next) => {
  try {
    const result = await userService.getJournalists(req.query);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getJournalistById = async (req, res, next) => {
  try {
    const result = await userService.getJournalistById(req.params.id);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const updateJournalist = async (req, res, next) => {
  try {
    const result = await userService.updateJournalist(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Journalist updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const result = await userService.toggleJournalistStatus(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Journalist status updated",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const deleteJournalist = async (req, res, next) => {
  try {
    await userService.deleteJournalist(req.params.id);

    res.status(200).json({
      success: true,
      message: "Journalist deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getJournalists,
  getJournalistById,
  updateJournalist,
  toggleStatus,
  deleteJournalist
};