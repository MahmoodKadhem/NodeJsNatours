const AppError = require('./../utils/appError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};
const sendErrorProd = (err, res) => {
  // Operational Error that we trust, sent it to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    // Programming Error, Unknown Error, don't send it to the client
  } else {
    // 1) log error
    console.error('Error:', err);
    // 2) send generic error message
    res.status(500).json({
      status: 'error',
      message: "Somthing went wrong! Please try again later."
    });
  }
};
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
const handleDublicateFieldDB = (err) => {
  const value = Object.entries(err.keyValue).map(([k, v]) => `${k}: ${v}`).join(', ');
  const message = `Duplicate field value ${value}, Please use another value.`;
  return new AppError(message, 400);
};
const handleValidationErrordDB = (err) => {
  // const value = Object.entries(err.errors).map(([k, v]) => `${k}: ${v.message}`).join(', ');
  const value = Object.values(err.errors).map(e => e.message).join(', ');
  const message = `Invalid input data: ${value}`;
  return new AppError(message, 400);
};
const handleJWTError = () => new AppError('Invalid accredentials! please login to resume access.', 401);
const handleJWTExpiredError = () => new AppError('Accredentials Expired! please login again to resume access.', 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; //Internal server error'
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res)

  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    console.log(err.name);
    console.log(err.code);
    // console.log(error.name);
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.name === 'MongoError') error = handleDublicateFieldDB(error);
    // if (err.code === 11000) error = handleDublicateFieldDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrordDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res)
  }
  next()
}