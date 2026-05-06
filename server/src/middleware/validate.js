const { ZodError } = require('zod');
const { HttpError } = require('../utils/httpError');

/**
 * @param {{ body?: any, params?: any, query?: any }} schemas
 */
function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        return next(new HttpError(400, 'VALIDATION_ERROR', 'Validation failed', e.flatten()));
      }
      next(e);
    }
  };
}

module.exports = { validate };
