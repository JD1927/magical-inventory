import * as Joi from 'joi';

export const ConfigValidationSchema = Joi.object({
  DB_NAME: Joi.required(),
  DB_PASSWORD: Joi.required(),
  PORT: Joi.number().default(3000),
});
