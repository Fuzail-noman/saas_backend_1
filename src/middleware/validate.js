import { ApiError } from '../utils/ApiError.js';

// Validates and replaces req.body with the parsed (trimmed / coerced) data.
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(new ApiError(400, errors[0]?.message || 'Invalid input', { errors }));
  }
  req.body = result.data;
  next();
};
