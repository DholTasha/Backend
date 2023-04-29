const express = require("express");
const authCustomer = require("../middlewares/authCustomer");
const customerController = require("../controllers/customerController");

const router = new express.Router();

// signup customer
// Code - Done
// Testing - Done
router.post("/customer/signup", customerController.signup_customer);

// login customer
// Code - Done
// Testing - Done
router.post("/customer/login", customerController.login_customer);

// logout customer
// Code - Done
// Testing - Done
router.post("/customer/logout", authCustomer, customerController.logout_customer);

// read customer
// Code - Done
// Testing - Done
router.get("/customer/me", authCustomer, customerController.customer_profile);

// update customer
// Code - Done
// Testing - Done
router.patch("/customer/me", authCustomer, customerController.customer_update);

// delete customer
// Code - Done
// Testing - Done
router.delete("/customer/me", authCustomer, customerController.customer_delete);

// get all pathaks
// Code - Done
// Testing - Done
router.get("/customer/pathak/all", customerController.get_all_pathak);

// company details,
// Code - Done
// Testing - Done
router.get("/customer/pathak/:pathakId", customerController.pathak_profile);

// get pathak events
// Code - Done
// Testing - Done
router.get("/customer/pathak/events/:pathakId", authCustomer, customerController.get_pathak_events);

// update customer password
// Code - Incomplete
// Testing - Incomplete
// router.post("/customer/password/update", authCustomer, customerController.customer_update_password);

// reset customer password
// Code - Incomplete
// Testing - Incomplete
// router.post("/customer/password/reset", customerController.customer_reset_password);

// forgot passwords
// Code - Incomplete
// Testing - Incomplete
// router.post("/customer/password/forgot", customerController.customer_forgot_password);

module.exports = router;