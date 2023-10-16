const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');

const catchAsync = fn => {
  return (req, res, next) => {
    // fn(req, res, next).catch(err => next(err));
    fn(req, res, next).catch(next); 
  }
}
//////////////////////////////////checking meddlewares///////////////////////
exports.aliasTopTour = (req,res,next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingsAverage';
  req.query.fields = 'name,ratingsAverage,price,summary,difficulty';
  next();
}

//////////////////////////////////ROUTE HANDLERS///////////////////////
exports.getAllTours = async (req, res) => {
  try {
    // 2)then we execute the query
    const features = 
      new APIFeatures(Tour.find(),req.query)
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
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err
    })
  }

}

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    // this is the same
    // const tour = await Tour.findOne({_id:req.params.id})
    // const tour = await Tour.findOne({name: req.params.id })
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    })
  }

}

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      tour: newTour
    }
  })
  // try {
  //   const newTour = await Tour.create(req.body);
  //   res.status(201).json({
  //     status: "success",
  //     data: {
  //       tour: newTour
  //     }
  //   })
  // } catch (err) {
  //   res.status(400).json({
  //     status: "fail",
  //     message: err
  //     // message: "Invalid data sent!"
  //   })
  // }

})

exports.updateTour = async (req, res) => {
  try {
    console.log(req.params.id);
    console.log(req.body);
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    console.log(tour)
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    })
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    })
  }
}

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id)
    res.status(204).json({
      status: 'success',
      data: null
    })
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    })
  }
}


// Aggregation
exports.getTourStats = async (req,res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: {ratingsAverage: {$gte : 4.5}}
      },
      {
        $group: {
          // _id: null,
          // _id: '$difficulty',
          // _id: '$ratingsAverage',
          _id: {$toUpper: '$difficulty'} ,
          numTours: {$sum: 1},
          numOfRating: {$sum: '$ratingsQuantity'},
          avgRating: {$avg: '$ratingsAverage'},
          avgPrice: {$avg: '$price'},
          avgMinPrice: {$min: '$price'},
          avgMaxPrice: {$max: '$price'},
        }
      },
      {
        $sort: {avgPrice : -1}
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    })
  }
}

exports.getMonthlyPlan = async (req,res) => {
  try {
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
          _id: {$month : '$startDates'},
          numOfTourStarts: {$sum: 1},
          tours: {$push: '$name'}
        }
      },
      {
        $addFields: {month : '$_id'}
      },
      {
        $project: {
          _id : 0
        }
      },
      {
        $sort: {numOfTourStarts: -1}
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    })
  }
}