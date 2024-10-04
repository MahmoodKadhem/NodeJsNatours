const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel'); //for embeding only no need for refrencing

// const validator = require('validator');

// creating a mongoos schema
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true,
    maxlength:
      [40, 'A tour name must have less then of equal then 40 charactor'],
    minlength:
      [10, 'A tour name must have more then of equal then 10 charactor'],
    // validate: [validator.isAlpha, 'Tour name must only contains charactors']
  },
  slug: {
    type: String,
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Ratings must be between 1 and 5'],
    max: [5, 'Ratings must be between 1 and 5']
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size'],
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a group size'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either: easy, medium, difficult.'
    }
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function (val) {
        // this only works when creating a new document not when update
        return val < this.price
      },
      message: 'Discount price ({VALUE}) must be less then the price'
    }
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a summary']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image']
  },
  images: [String],
  createdAt: {
    type: Date,
    // default: Date.now(),// saving the time the document was sent.
    default: Date.now,// saving the time the server inserted the document
    select: false
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  startLocation: {
    // GeoJson
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],
  // guides: Array //embeding users
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ]
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// virtual property
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7
})

// virtual populate to child refrence reviews to the tour
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //the place we store the connection in the review model.
  localField: '_id' // the field we want to compate it to.
})

// mongoose DOCUMENT meddleware//////////////////////
// pre will be run before the command 'save() and create()' but not on insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next()
})

tourSchema.post('save', function (doc, next) {
  // console.log(doc);
  next();
})

// // Embeding users in the tour schema which is now what we want
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async id => await user.findById(id)); //the result is a promises
//   this.guides = await Promise.all(guidesPromises) // we need to wait for the promises
//   next()
// })

// mongoose QUERY Middleware//////////////////////
// tourSchema.pre('find', function(next) { //dosen't work with findOne
tourSchema.pre(/^find/, function (next) { //reqular expression ^ start with
  this.find({ secretTour: { $ne: true } })
  this.start = Date.now()
  next();
});

// populate the guides userinfo as a middleware
tourSchema.pre(/^find/, function (next) { //reqular expression ^ start with
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -createdAt'
  });
  next();
});

tourSchema.post(/find/, function (doc, next) {
  console.log(`the query took: ${Date.now() - this.start} millisecondes`);
  // console.log(doc);
  next();
})

// mongoose AGGREGATION Middleware//////////////////////
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // console.log(this.pipeline())
  next();
})

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;