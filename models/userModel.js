const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'You must enter a name!']
  },
  email: {
    type: String,
    required: [true, 'Please enter an email address'],
    unique: [true, 'This email address is used by another user'],
    lowerCase: true,
    validate: [validator.isEmail, 'Please enter a valid email address']
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin']
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // never show the password !!!!! Important.
    // vaildate: [validator.isLength(8, 32), 'Password must be between 8 and 32 characters'] //Not working
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password.'],
    validate: {
      // THIS ONLY WORKS ON SAVE AND CREATE METHOD NOT UPDATE
      validator: function(e) {
        return e === this.password;
      },
      message: "The Passwords dosen't match"
    }
  },
  passwordChangedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
  // }, {
  //   toJSON: { virtuals: true },
  //   toObject: { virtuals: true },
});

userSchema.pre('save', async function(next) {
  // only run this function if passwored are actually modified
  if (!this.isModified('password')) return next();
  // hash the password with salt of 12
  // this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync(8));
  this.password = await bcrypt.hash(this.password, 12);
  // delete the passwordConfirm filed
  this.passwordConfirm = undefined;
  next();
});

// instance method: a method that is going to be available on all document of certen collection??
userSchema.methods.correctPassword =
  async function(candidatePassword, userPassword) {
    // this.password will not be availabe since the passwored in the model is not selected.
    return await bcrypt.compare(candidatePassword, userPassword)
  }

// instance method: to check if the user changed the password after issuing the token.
userSchema.methods.changePasswordAfter = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimeStamp < changedTimeStamp;
  }

  return false;
}

const User = mongoose.model('User', userSchema);
module.exports = User;