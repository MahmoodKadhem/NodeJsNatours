const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

const app = express();
//////////////////////////////////MIDDLEWARES///////////////////////
// morgan middleware for logging http requests
app.use(morgan('dev'));

// express middleWare
app.use(express.json());

// creating my own middleware
app.use((req, res, next) => {
  console.log('hello from the middleware!');
  next();
})

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
})

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

//////////////////////////////////ROUTE HANDLERS///////////////////////
const getAllTours = (req, res) => {
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

const getTour = (req, res) => {
  const id = Number(req.params.id);

  const tour = tours.find(e => e.id === id);

  // if no tour found
  if (!tour) {
    return res.status(404).json({
      status: 'failed',
      message: 'Invalid ID'
    });
  }

  // if the tour is found
  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  })
}

const createTour = (req, res) => {
  const newID = tours[tours.length - 1].id + 1
  const newTour = Object.assign({ id: newID }, req.body);

  tours.push(newTour);

  fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    () => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour
        }
      })
    })
}

const updateTour = (req, res) => {
  if (Number(req.para.id) > tours.length) {
    res.status(404).json({
      status: 'Failed',
      message: 'Invalid ID'
    })
  }

  res.status(200).json({
    status: 'success',
    data: '< updated tour her >'
  })
}

const deleteTour = (req, res) => {
  if (Number(req.para.id) > tours.length) {
    res.status(404).json({
      status: 'Failed',
      message: 'Invalid ID'
    })
  }

  res.status(204).json({
    status: 'success',
    data: null
  })
}

const getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'This route is not yet defined.'
  })
}

const createUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'This route is not yet defined.'
  })
}

const getUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'This route is not yet defined.'
  })
}

const updateUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'This route is not yet defined.'
  })
}

const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'This route is not yet defined.'
  })
}

////////////////////////////////ROUTES///////////////////////
// creating routers and mounting them
const tourRouter = express.Router();

tourRouter
  .route('/')
  .get(getAllTours)
  .post(createTour);

tourRouter
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

const userRouter = express.Router();

userRouter
  .route('/')
  .get(getAllUsers)
  .post(createUser);

userRouter
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//////////////////////////////////START SERVER///////////////////////
const port = 3000
app.listen(port, () => {
  console.log(`app running on port: ${port}`);
});