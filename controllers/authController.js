const { promisify } = require('util');// to use the build-in pormisefy function for node.
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError')

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body); //this is flawed any one can sign as admin we cant take the hole body when we create a new user.
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });

  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN
  // })
  const token = signToken(newUser._id);

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {

  const { email, password } = req.body;

  // Steps to login
  // 1) check if the user typed an email and password
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400))
  }

  // 2)check if the user and password is correct
  // const user = User.findOne({email:email}) same as bellow.
  const user = await User.findOne({ email }).select('+password');
  // in order to select an unselected field we need '+fieldName'.
  // const correct = await user.correctPassword(password, user.password);
  // if (!user || !correct) {
  // this will not work if the user is not found

  if (!user || !await user.correctPassword(password, user.password)) {
    return next(new AppError('Incorrect email or password!', 401))
    // we could do this seperate but this is better for security so the attacker don't know which one is incorrect.
  }

  // 3)if everything is Ok, sent JWT token to the client

  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  })
});

// to protect our routes from unauthurise entry we will create a middle ware function.
exports.protect = catchAsync(async (req, res, next) => {
  // 1) get the token and check if it's there!
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new AppError('Authorization Error: Please login to get access.', 401))
  }

  // 2) varification token
  const decodedPayload = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  // console.log(decodedPayload);

  // what if the account has been deleted, the user will still be able to use the token to log in,if not for the following step
  // 3) check if the user still exists
  const userWithIdFound = await User.findById(decodedPayload.id);
  if (!userWithIdFound) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }
  // What if the account was stolen and the password was change the token will still work, if not for the following step
  // 4) check if user changed password after the token was issued
  if (userWithIdFound.changePasswordAfter(decodedPayload.iat)) {// issued at (iat)
    return next(new AppError('User recently changed password! Please login again', 401))
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = userWithIdFound // we may use it in the future
  next()
});

exports.restrictTo = catchAsync(async (req, res, next) => {

  next()
})