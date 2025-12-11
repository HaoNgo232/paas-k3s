import * as Joi from 'joi';

/**
 * Validation schema cho tất cả environment variables
 * Được sử dụng bởi ConfigModule để validate env variables khi khởi động
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number(),
  DATABASE_URL: Joi.string().required(),
  GITHUB_CLIENT_ID: Joi.string().required(),
  GITHUB_CLIENT_SECRET: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  KUBECONFIG: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  FRONTEND_URL: Joi.string(),
});
