const Event = require("../models/event.js");

// Add Event
module.exports.add_event = async (req, res) => {
  try {
    await Event.create(req.event);
    // req.team.numberOfEvents++;
    res.status(201).json({ success: true, message: "Event Added Successfully." });
  } catch (err) {
    res.status(400).json({success: false, errors: err, message: "Error while adding event."});
  }
};

// Update Event
module.exports.update_event = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "location", "maleDhol", "femaleDhol", "maleTasha", "femaleTasha", "videoLink"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
      return res.status(400).send({ msg: "Invalid updates!" });
  }

  try {
      const event = await Event.findOne({
          _id: req.params.eventId,
      });

      if (!event) {
          return res.status(404).send();
      }

      updates.forEach((update) => (event[update] = req.body[update]));
      await event.save();
      res.send(event);
  } catch (e) {
      res.status(400).send(e);
  }
};

// Delete event
module.exports.delete_event = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.eventId);
    if (!event) {
      return res.status(400).json({ success: false, message: "Event not found" });
    }
    // req.team.numberOfEvents--;
    res.status(200).json({ message: "Event deleted successfully", success: true });
  }catch {
    res.status(400).json({ success: false, message: "Error" });
  }
};

//Get Event Details
module.exports.get_event = async(req,res) => {
  const eventId = req.params.eventId;
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(400).json({ success: false, message: "Event not found" });
    }
    res.status(200).json({ event, success: true });
  } catch {
    res.status(400).json({ success: false, message: "Login or Signup" });
  }
};