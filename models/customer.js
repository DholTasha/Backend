const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
      type: String,
      required: true,
      unique: true, //as email needs to be unique
      validate: [isEmail, "Please enter a valid email"],
  },
  password: {
      type: String,
      required: true,
      minlength: 6,
  },
  mobile: {
      type: Number,
      required: true,
  },
  // numberOfEvents: {
  //   type: Number,
  //   default: 0
  // },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    resetPasswordTokenForForgotPassword: String,
});

customerSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// login customer
customerSchema.statics.login = async function (email, password) {
  const customer = await this.findOne({ email });
  if (customer) {
    const auth = await bcrypt.compare(password, customer.password);
    if (auth) {
      return customer;
    }
    throw Error("Incorrect Password");
  }
  throw Error("Incorrect Email");
};

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;