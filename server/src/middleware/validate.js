const Joi = require('joi');

const schemas = {
  register: Joi.object({
    username: Joi.string().min(2).max(30).required().messages({
      'string.empty': '用户名不能为空',
      'string.min': '用户名至少 2 个字符',
      'string.max': '用户名最多 30 个字符',
    }),
    email: Joi.string().email().required().messages({
      'string.email': '邮箱格式不正确',
      'string.empty': '邮箱不能为空',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': '密码至少 6 个字符',
      'string.empty': '密码不能为空',
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  work: Joi.object({
    type: Joi.string().valid('tv', 'book', 'movie', 'other').required(),
    title: Joi.string().min(1).max(200).required(),
    subtitle: Joi.string().max(200).allow('').optional(),
    author: Joi.string().max(100).allow('').optional(),
    cover: Joi.string().uri().allow('').optional(),
    description: Joi.string().allow('').optional(),
    totalEpisodes: Joi.number().integer().min(0).optional(),
    totalPages: Joi.number().integer().min(0).optional(),
    currentEpisode: Joi.number().integer().min(0).default(0),
    currentPage: Joi.number().integer().min(0).default(0),
    status: Joi.string()
      .valid('wish', 'watching', 'watched', 'paused', 'dropped')
      .default('wish'),
    rating: Joi.number().integer().min(0).max(5).default(0),
    moodColor: Joi.string().allow('').optional(),
    tags: Joi.array().items(Joi.string()).default([]),
  }),

  workProgress: Joi.object({
    currentEpisode: Joi.number().integer().min(0).optional(),
    currentPage: Joi.number().integer().min(0).optional(),
    status: Joi.string()
      .valid('wish', 'watching', 'watched', 'paused', 'dropped')
      .optional(),
    moodColor: Joi.string().allow('').optional(),
  }),

  workRating: Joi.object({
    rating: Joi.number().integer().min(0).max(5).required(),
    moodColor: Joi.string().allow('').optional(),
  }),

  note: Joi.object({
    workId: Joi.string().required(),
    content: Joi.string().min(1).required(),
    moodColor: Joi.string().allow('').optional(),
    isPrivate: Joi.boolean().default(false),
    location: Joi.object({
      episode: Joi.number().integer().min(0).optional(),
      page: Joi.number().integer().min(0).optional(),
      chapter: Joi.string().allow('').optional(),
    }).optional(),
  }),

  tag: Joi.object({
    name: Joi.string().min(1).max(30).required(),
    color: Joi.string().allow('').optional(),
  }),
};

const validate = (schema) => (req, res, next) => {
  const { error, value } = schemas[schema].validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = {};
    error.details.forEach((detail) => {
      details[detail.path.join('.')] = detail.message;
    });
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: '参数校验失败', details },
    });
  }

  req.body = value;
  next();
};

module.exports = { validate, schemas };
