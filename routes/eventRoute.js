const express = require("express");
const authPathak = require("../middlewares/authPathak");
const eventController = require("../controllers/eventController");

const router = new express.Router();

// get event
router.get("/event/deatils/:eventId", authPathak, eventController.get_event);

// add event
router.post("/event/add", authPathak, eventController.add_event);

// update event
router.post("/event/update", authPathak, eventController.update_event);

// delete event
router.delete("/event/delete/:eventId", authPathak, eventController.delete_event);


module.exports = router;