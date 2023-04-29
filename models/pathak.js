const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const pathakSchema = new mongoose.Schema(
    {
      email: {
            type: String,
            required: true,
            unique: true, //as email needs to be unique
            validate: [isEmail, "Please enter a valid email"],
      },    
        
        name: {
            type:String,
            required:true
        },

        maleDhol: {
            type:Number,
            required: true
        },

        maleTasha: {
            type:Number,
            required: true
        },

        femaleDhol: {
            type:Number,
            required: true
        },

        femaleTasha: {
            type:Number,
            required: true
        },


        // contact: {
           
        // },

        address: {
            type: String,
            required: true
        },

        videoLink: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
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

const Pathak = mongoose.model("Pathak", pathakSchema);

module.exports = Pathak;