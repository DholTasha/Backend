const express = require("express");
const authPathak = require("../middlewares/authPathak");
const pathakController = require("../controllers/pathakController");

const router = new express.Router();

// signup pathak
// Code - Done
// Testing - Done
router.post("/pathak/signup", pathakController.signup_pathak);

// login pathak
// Code - Done
// Testing - Done
router.post("/pathak/login", pathakController.login_pathak);

// logout pathak
// Code - Done
// Testing - Done
router.post("/pathak/logout", authPathak, pathakController.logout_pathak);

// get pathak profile
// Code - Done
// Testing - Done
router.get("/pathak/me", authPathak, pathakController.pathak_profile);

// update pathak
// Code - Done
// Testing - Done
router.patch("/pathak/me", authPathak, pathakController.pathak_update);

// delete pathak
// Code - Done
// Testing - Done
router.delete("/pathak/me", authPathak, pathakController.pathak_delete);

// get all events
// Code - Done
// Testing - Done
router.get("/pathak/events/all", authPathak, pathakController.get_pathak_events);

// get all pathak
// Code - Done
// Testing - Done
router.get("/pathak/all", pathakController.get_all_pathak);

// get other pathak events
// Code - Done
// Testing - Done
router.get("/pathak/event/details/:pathakId", authPathak, pathakController.get_other_pathak_events);


// update password for pathak:
// Code - Incomplete
// Testing - Incomplete
// router.post("/pathak/password/update", authPathak, pathakController.pathak_update_password);

// reset pathak password
// Code - Incomplete
// Testing - Incomplete
// router.post("/pathak/password/reset", pathakController.pathak_reset_password);

// forgot passwords
// Code - Incomplete
// Testing - Incomplete
// router.post("/pathak/password/forgot", pathakController.pathak_forgot_password);

module.exports = router;