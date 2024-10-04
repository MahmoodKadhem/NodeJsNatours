const crypto = require('crypto')
const { promisify } = require('util');// to use the build-in pormisefy function for node.
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const { STATUS_CODES } = require('http');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    // secure: true,
    httpOnly: true
  }
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // remove the password from the output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
}

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body); //this is flawed any one can sign as admin we cant take the hole body when we create a new user.
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN
  // })
  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
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

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // getting the user from the preceding meddleware.
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to preform this action.', 403))
    }

    next();
  }
};

// reset password when forgoten
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404)) //404 means not found
  }

  // 2) generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });//this is done to remove all the validators when updating the database

  // 3)send it to user's email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    })

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    })
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email, try again later!', 500))
  }

});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gt: Date.now() }
  });

  // 2) if token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired!', 400))
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save(); // we don't want to turn off the validators

  // 3) update changePasswordAt property for the user
  // we made it as a pre middle ware in the user model

  // 4) log the user in(sent the JSW token to the web client)
  createSendToken(user, 200, res);
});

// reset password with old password
exports.updateMyPassword = catchAsync(async (req, res, next) => {
  const { passwordCurrent, password, passwordConfirm } = req.body;
  // 1) get the user from the collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) check if the POSTed password is correct
  if (!await user.correctPassword(passwordCurrent, user.password)) {
    return next(new AppError("Current password doesn't match!", 401))
  }

  // 3) If so, update the password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save(); // we don't want to turn off the validators

  // 4) Login the user, sent the JWT
  createSendToken(user, 200, res);
});

