const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();
//////////////////////////////////MIDDLEWARES///////////////////////
// morgan middleware for logging http requests - only use in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// express middleWare
app.use(express.json());
// serving static files
app.use(express.static(`${__dirname}/public`));

// creating my own middleware

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//////////////////////////////////ROUTES///////////////////////
// mouting the routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`,404))
});

app.use(globalErrorHandler);

module.exports = app;