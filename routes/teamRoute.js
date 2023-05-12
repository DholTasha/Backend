const express = require("express");
const authTeam = require("../middlewares/authTeam");
const teamController = require("../controllers/teamController");

const router = new express.Router();

// signup team
// Code - Done
// Testing - Done
router.post("/team/signup", teamController.signup_team);

// login team
// Code - Done
// Testing - Done
router.post("/team/login", teamController.login_team);

// logout team
// Code - Done
// Testing - Done
router.post("/team/logout", authTeam, teamController.logout_team);

// get team profile
// Code - Done
// Testing - Done
router.get("/team/me", authTeam, teamController.team_profile);

// update team
// Code - Done
// Testing - Done
router.patch("/team/me", authTeam, teamController.team_update);

// delete team
// Code - Done
// Testing - Done
router.delete("/team/me", authTeam, teamController.team_delete);

// get all events
// Code - Done
// Testing - Done
router.get("/team/events/all", authTeam, teamController.get_team_events);

// get all team
// Code - Done
// Testing - Done
router.get("/team/all", teamController.get_all_team);

// get other team profile
// Code - Done
// Testing - Done
router.get("/team/profile/:teamId", authTeam, teamController.get_other_team_profile);

// get other team events
// Code - Done
// Testing - Done
router.get("/team/event/details/:teamId", authTeam, teamController.get_other_team_events);


// update password for team:
// Code - Incomplete
// Testing - Incomplete
// router.post("/team/password/update", authTeam, teamController.team_update_password);

// reset team password
// Code - Incomplete
// Testing - Incomplete
// router.post("/team/password/reset", teamController.team_reset_password);

// forgot passwords
// Code - Incomplete
// Testing - Incomplete
// router.post("/team/password/forgot", teamController.team_forgot_password);

module.exports = router;