
import "dotenv/config";

const requiredVariables = [
  "MONGODB_URI",
  "NEWS_API_KEY",
  "NEWS_API_BASE_URL",
  "JWT_SECRET"
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing environment variable: ${variable}`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,

  nodeEnv: process.env.NODE_ENV || "development",

  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",

  mongoUri: process.env.MONGODB_URI,

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  },

  newsApi: {
    baseUrl: process.env.NEWS_API_BASE_URL,
    apiKey: process.env.NEWS_API_KEY,
    country: process.env.NEWS_API_COUNTRY || "us"
  }
};
