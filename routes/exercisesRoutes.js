const express = require('express');
const router = express.Router();
const tourController = require('./../controllers/tourController');
//////////////////////////////////PARAMS MIDDLEWARE///////////////////////
// router.param('id', tourController.checkID)
//////////////////////////////////ROUTES///////////////////////
// Aliasing route
router
  .route('/top-5-cheap-tours')
  .get(tourController.aliasTopTour,tourController.getAllTours)

router
  .route('/tour-stats')
  .get(tourController.getTourStats)
router
  .route('/monthly-plan/:year')
  .get(tourController.getMonthlyPlan)

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;