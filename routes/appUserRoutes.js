const express = require('express');
const router = express.Router();
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');



//////////////////////////////////Auth ROUTES///////////////////////
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updateMyPassword',
  authController.protect,
  authController.updateMyPassword);

//////////////////////////////////User ROUTES///////////////////////
router.patch('/updateMe',
  authController.protect,
  userController.updateMe);
router.delete('/deleteMe',
  authController.protect,
  userController.deleteMe);


router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;