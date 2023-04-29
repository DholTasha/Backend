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

// Add Event
module.exports.add_event = async (req, res) => {
  const event = req.body;
  try {
    await Event.create(event);
    res
      .status(201)
      .json({ success: true, message: "Event Added Successfully." });
  } catch (err) {
    res.status(400).json({
      success: false,
      errors: err,
      message: "Error while adding event.",
    });
  }
};

// Update Event
module.exports.update_event = async (req, res) => {
  const { eventId, event } = req.body;
  try {
    await Event.findByIdAndUpdate(eventId, event);
    res.status(200).json({
      success: true,
      message: "Event Details Updated Successfully.",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
      message: "Error while Updating Event Details.",
    });
  }
};

// Delete Company
module.exports.delete_event = async (req, res) => {
  const eventId = req.params.eventId;
  try {
    // Company.findById(companyId).populate({path: 'jobDescriptions'}).exec(function(err, company) {
    //   if(err) {
    //     return res.status(400).json({ success: true, error: err });
    //   }
    //   console.log('company', company);
    // });
    // await Company.findByIdAndDelete(companyId);
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "event not found",
      });
    }

    await event.remove();

    res.status(200).json({
      success: true,
      message: "Event Deleted Successfully.",
    });
  } catch {
    res.status(400).json({
      success: false,
      message: "Error while Deleting Event.",
    });
  }
};

//Get Event Details
module.exports.get_event = async(req,res) => {
  const eventId = req.params.eventId;
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "Event not found" });
    }
    res.status(200).json({ event, success: true });
  } catch {
    res.status(400).json({ success: false, message: "Login or Signup" });
  }
};