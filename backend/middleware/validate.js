import { ApiError } from '../utils/ApiError.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path.join('.') || source;
        fieldErrors[fieldName] = issue.message;
      }

      return next(
        new ApiError(
          400,
          'VALIDATION_ERROR',
          'Validation failed. Please check your inputs.',
          fieldErrors
        )
      );
    }

    req[source] = result.data;
    next();
  };
}
