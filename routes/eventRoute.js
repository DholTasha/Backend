const express = require("express");
const authEvent = require("../middlewares/authEvent");
const eventController = require("../controllers/eventController");

const router = new express.Router();

// add event
// Code - Done
// Testing - Done
router.post("/event/add", authEvent, eventController.add_event);

// get event
// Code - Done
// Testing - Done
router.get("/event/details/:eventId", authEvent, eventController.get_event);

// update event
// Code - Done
// Testing - Done
router.patch("/event/update/:eventId", authEvent, eventController.update_event);

// delete event
// Code - Done
// Testing - Done
router.delete("/event/delete/:eventId", authEvent, eventController.delete_event);

module.exports = router;