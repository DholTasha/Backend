const mongoose = require("mongoose");
const Event = require("../models/event.js");

// handle error
const handleErrors = (err) => {
    let errors = { email: "", password: "" };
  
    // incorrect email
    if (err.message === "Incorrect Email") {
      errors.email = "Email is not Registered";
    }
    // incorrect password
    if (err.message === "Incorrect Password") {
      errors.password = "Wrong password";
    }
  
    // duplicate error code
    if (err.code == 11000) {
      errors.email = "This Email is already Registered";
    }
  
    // validation Eroor
    if (err.message.includes("User validation failed")) {
      Object.values(err.errors).forEach(({ properties }) => {
        errors[properties.path] = properties.message;
      });
    }
    return errors;
  };