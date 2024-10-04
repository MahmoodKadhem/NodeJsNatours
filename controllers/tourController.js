const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

//////////////////////////////////checking meddlewares///////////////////////
exports.aliasTopTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingsAverage';
  req.query.fields = 'name,ratingsAverage,price,summary,difficulty';
  next();
};

//////////////////////////////////ROUTE HANDLERS///////////////////////
exports.getAllTours = catchAsync(async (req, res, next) => {
  // 2)then we execute the query
  const features =
    new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
  const tours = await features.query;

  // 3)send response
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours
    }
  })
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // this is the same
  // const tour = await Tour.findOne({_id:req.params.id})
  // const tour = await Tour.findOne({name: req.params.id })

  if (!tour) {
    return next(new AppError(`tour with id: ${req.params.id} not found`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      tour: newTour
    }
  })
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tour) {
    return next(new AppError(`tour with id: ${req.params.id} not found`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  })
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError(`tour with id: ${req.params.id} not found`, 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  })
});


// Aggregation
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        // _id: null,
        // _id: '$difficulty',
        // _id: '$ratingsAverage',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numOfRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        avgMinPrice: { $min: '$price' },
        avgMaxPrice: { $max: '$price' },
      }
    },
    {
      $sort: { avgPrice: -1 }
    },
    // {
    //   $match: {_id: {$ne : 'EASY'}}
    // },
  ])

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  })
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numOfTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numOfTourStarts: -1 }
    },
    {
      $limit: 10
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  })
});
