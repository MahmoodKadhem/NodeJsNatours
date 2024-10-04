const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {}
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
}

exports.getAllUsers = catchAsync(async (req, res, next) => {

  const users = await User.find();

  // 3)send response
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: users.length,
    data: {
      users
    }
  })
})

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'This route is not yet defined.'
  })
}

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'This route is not yet defined.'
  })
}

// for the admin to update users
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'This route is not yet defined.'
  })
}

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'This route is not yet defined.'
  })
}


// leting the user update his information
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create error if the user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates. please use /updateMyPassword.", 400))
  }

  // 2) filtered out unwanted fields names that are not allowed to be updated
  // const filteredBody = filterObj(req.body, 'name'); // only update name
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update the user document 
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });
  //options: new return the updated user, runValidator to validate it 


  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })
});

// allowing the user to delete his account, we don't accually delete the data we only set it to inactive.
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })

  res.status(204).json({
    status: 'success',
    data: null
  })
});