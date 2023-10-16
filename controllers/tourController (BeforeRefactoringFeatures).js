const Tour = require('./../models/tourModel');

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
    console.log(req.query);
    // 1A) first we build the query ///////////
    // filtering
    const queryObj = { ...req.query };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach(el => delete queryObj[el])

    // 1B) Advance filtering /////////////////////
    // when useing greater then lesser then the query should be like this in mongoDB. {'difficulty' : 'easy', 'duration' : {$gte : 5}}
    // operatore to replace gte, gt, lte, lt.
    // replacing them using regular expressions
    const queryString = JSON.stringify(queryObj).replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // console.log(JSON.parse(queryString));


    ///////////////////// query methods /////////////////////////
    // const tours = await Tour.find()
    let query = Tour.find(JSON.parse(queryString))

    // 1C) Sorting ////////////////////////////
    if (req.query.sort) {
      // In order use more sorting we use .sort('price ratingsAverage');
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt _id');
    }

    // 1D) Field limiting
    if (req.query.fields) {
      // In order use more field limiting we use 
      // .select('price ratingsAverage name'); this is caled projecting
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');

    }

    // 1E) Pagination
    // /tours?page=2&limit=10 // 1 to 10 page 1// 11 to 20 page 2//...
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;
    console.log(skip,limit)
    query = query.skip(skip).limit(limit)

    if(req.query.page){
      const numTours = await Tour.countDocuments();
      if (skip >= numTours) throw new Error('this page dose not exist')
    }

    // 2)then we execute the query
    const tours = await query
    // const tours = Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

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

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        tour: newTour
      }
    })
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err
      // message: "Invalid data sent!"
    })
  }

}

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
