const Review = require('./../models/reviewModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const filterObj = require('./../utils/filterObj');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const features =
    new APIFeatures(Review.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
  const reviews = await features.query;

  // 3)send response
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: reviews.length,
    data: {
      reviews
    }
  })
});

exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError(`review with id: ${req.params.id} not found`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      review
    }
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  // Allow nested routes
  let { review, rating, tour, user } = req.body;
  if (!tour) tour = req.params.tourId;
  if (!user) user = req.user.id;
  console.log(tour);
  console.log(user);

  const reviewObj = {
    review,
    rating,
    tour,
    user
  }

  const newReview = await Review.create(reviewObj);
  res.status(201).json({
    status: "success",
    data: {
      review: newReview
    }
  })
});

exports.updateReview = catchAsync(async (req, res, next) => {
  // 1) check if the review belongs to the user
  const review = await Review.findById(req.params.id);

  if (!review) return next(new AppError(`Review is not found!`, 404));

  if (review.user.id !== req.user.id) {
    return next(new AppError(`This review dosen't belong to this user!`, 404));
  }

  // 2) filtered out unwanted fields names that are not allowed to be updated
  // const filteredBody = filterObj(req.body, 'name'); // only update name
  const filteredBody = filterObj(req.body, 'review', 'rating');

  // 3) Update the user document 
  const updatedReview = await Review.findByIdAndUpdate(req.params.id, filteredBody, { new: true, runValidators: true });
  //options: new return the updated user, runValidator to validate it 


  res.status(200).json({
    status: 'success',
    data: {
      review: updatedReview
    }
  })
});