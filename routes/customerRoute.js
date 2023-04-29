const express = require("express");
const authCustomer = require("../middlewares/authCustomer");
const customerController = require("../controllers/customerController");

const router = new express.Router();

// signup customer
router.post("/customer/signup", customerController.signup_customer);

// login customer
router.post("/customer/login", customerController.login_customer);

// logout customer
router.post("/customer/logout", authCustomer, customerController.logout_customer);

// read customer
router.get("/customer/me", authCustomer, customerController.customer_profile);

// update customer
router.post("/customer/update", authCustomer, customerController.customer_update);

// delete customer
router.delete("/customer/delete", authCustomer, customerController.customer_delete);

// get Currently On Going Company Jobs,
router.get("/customer/pathak", customerController.pathak);

// company details,
router.get("/customer/pathak/:pathakId", authCustomer, customerController.pathak_details);

// get all pathak events
router.get("/customer/pathak/events/:pathakId", authPathak, pathakController.get_all_pathak_events);

// customerApplyForCompanies later - companyid take from req.body._id
router.post("/customer/pathak/event/:pathakId", authCustomer, customerController.pathak_event_details);

// update customer password
router.post("/customer/password/update", authCustomer, customerController.customer_update_password);

// reset customer password
router.post("/customer/password/reset", customerController.customer_reset_password);

// forgot passwords
router.post("/customer/password/forgot", customerController.customer_forgot_password);

module.exports = router;