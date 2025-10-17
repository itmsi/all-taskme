const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500
  };

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      statusCode: 401
    };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = {
      message: Object.values(err.errors).map(val => val.message).join(', '),
      statusCode: 400
    };
  }

  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    error = {
      message: 'Data sudah ada',
      statusCode: 409
    };
  }

  if (err.code === '23503') { // Foreign key constraint violation
    error = {
      message: 'Referensi data tidak valid',
      statusCode: 400
    };
  }

  if (err.code === '23502') { // Not null constraint violation
    error = {
      message: 'Data wajib diisi',
      statusCode: 400
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'Ukuran file terlalu besar',
      statusCode: 400
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: 'Field file tidak diharapkan',
      statusCode: 400
    };
  }

  res.status(error.statusCode).json({
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
