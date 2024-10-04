const express = require('express');
const router = express.Router();
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');

//////////////////////////////////PARAMS MIDDLEWARE///////////////////////
// router.param('id', tourController.checkID)
//////////////////////////////////ROUTES///////////////////////
// Aliasing route
router
  .route('/top-5-cheap-tours')
  .get(tourController.aliasTopTour, tourController.getAllTours)

router
  .route('/tour-stats')
  .get(tourController.getTourStats)
router
  .route('/monthly-plan/:year')
  .get(tourController.getMonthlyPlan)

router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect,
    authController.restrictTo('admin', "lead-guide"),
    tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect,
    authController.restrictTo('admin', "lead-guide"),
    tourController.updateTour)
  .delete(authController.protect,
    authController.restrictTo('admin', "lead-guide"),
    tourController.deleteTour);

router
  .route('/:tourId/reviews')
  .post(authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview)

module.exports = router;