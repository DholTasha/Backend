const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const customerSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true, //as email needs to be unique
            validate: [isEmail, "Please enter a valid email"],
          },
        
        username: {
            type: String,
            required: true,
            unique: true
          },
    
        password: {
            type: String,
            required: true,
            minlength: 6,
          },

        name: {
            type:String,
            required:true
        },

        mobile: {
            type: Number,
            required: true,
            unique: true
        },

        numberOfEvents: {
          type: Number,
          required: true
        },
      
          //new fields :
          resetPasswordToken: String,
          resetPasswordExpire: Date,
          resetPasswordTokenForForgotPassword: String,
        
    }
)

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;