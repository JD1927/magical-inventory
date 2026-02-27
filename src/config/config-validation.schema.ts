import * as Joi from 'joi';

export const ConfigValidationSchema = Joi.object({
  DB_NAME: Joi.required(),
  DB_PASSWORD: Joi.required(),
  DB_SSL: Joi.string().valid('true', 'false').default('false'),
  DB_SYNCHRONIZE: Joi.string().valid('true', 'false').default('false'),
  PORT: Joi.number().default(3000),
  ADMIN_EMAIL: Joi.string().email().required(),
  JWT_SECRET: Joi.string().required(),
  RP_NAME: Joi.string().required(),
  RP_ID: Joi.string().required(),
  RP_ORIGIN: Joi.string().required(),
});
