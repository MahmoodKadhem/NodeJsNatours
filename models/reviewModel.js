const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review can not be empty!'],
  },
  rating: {
    type: Number,
    default: 3,
    min: [1, 'Ratings must be between 1 and 5'],
    max: [5, 'Ratings must be between 1 and 5'],
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to a tour.'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a User.'],
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // })
  this.populate({
    path: 'user',
    select: 'name photo'
  })
  next();
})

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;