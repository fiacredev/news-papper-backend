
import authService from "../services/auth.service.js";

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const createJournalist = async (req, res, next) => {
  try {
    const journalist = await authService.createJournalist(req.body);

    res.status(201).json({
      success: true,
      message: "Journalist account created successfully",
      data: journalist
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user._id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const authController = {
  login,
  createJournalist,
  getProfile
};

export default authController;
