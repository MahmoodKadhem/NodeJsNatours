const fs = require('fs');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);


//////////////////////////////////checking meddlewares///////////////////////
exports.checkID = (req, res, next, val) => {
  console.log(`The id is: ${val}`);
  if (Number(req.params.id) > tours.length) {
    res.status(404).json({
      status: 'Failed',
      message: 'Invalid ID'
    })
  }
  next();
}

exports.checkBody = (req, res, next) => {
  console.log('checking body')
  if (!req.body || !req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing properties.'
    });
  }
  next();
}

//////////////////////////////////ROUTE HANDLERS///////////////////////
exports.getAllTours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours
    }
  })
}

exports.getTour = (req, res) => {
  const id = Number(req.params.id);

  const tour = tours.find(e => e.id === id);

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  })
}

exports.createTour = (req, res) => {
  const newID = tours[tours.length - 1].id + 1
  const newTour = Object.assign({ id: newID }, req.body);

  tours.push(newTour);

  fs.writeFile(`${__dirname}/../dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    () => {
      res.status(201).json({
        status: 'success',
        // data: {
        //   tour: newTour
        // }
      })
    })
}

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: '< updated tour her >'
  })
}

exports.deleteTour = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: null
  })
}
