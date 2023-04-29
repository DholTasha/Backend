const express = require("express");
const authPathak = require("../middlewares/authPathak");
const pathakController = require("../controllers/pathakController");

const router = new express.Router();

// signup pathak
router.post("/pathak/signup", pathakController.signup_pathak);

// login pathak
router.post("/pathak/login", pathakController.login_pathak);

// logout pathak
router.post("/pathak/logout", authPathak, pathakController.logout_pathak);

// update password for pathak:
router.post("/pathak/password/update", authPathak, pathakController.pathak_update_password);

// reset pathak password
router.post("/pathak/password/reset", pathakController.pathak_reset_password);

// forgot passwords
router.post("/pathak/password/forgot", pathakController.pathak_forgot_password);

// get a pathak events
router.get("/pathak/event/details/:pathakId", authPathak, pathakController.get_job);

// get all events
router.get("/pathak/events/all", authPathak, pathakController.get_all_pathak_events);

// get dashboard details
router.get("/pathak/dashboard/details", authPathak, pathakController.get_dashboard_details);

// Report Generation
router.get("/pathak/student/report/generate", authPathak, pathakController.generate_report);

// delete event 
router.delete("/pathak/event/delete/:eventId", authPathak, pathakController.pathak_event_delete);

module.exports = router;