const Customer = require("../models/customer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Event = require("../models/event");
const crypto = require("crypto");
const nodeMailer = require("nodemailer");

const { createToken } = require("../utils/createToken");
const maxAge = 3 * 24 * 60 * 60;

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

const tokenAge = parseInt(process.env.JWT_AGE);

// signup customer
module.exports.signup_customer = async (req, res) => {
    const customer = req.body;
  
    const { error } = Customer.validate(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
  
    try {
      const newCustomer = await Customer.create(customer);
  
      const message = `Customer Account for DholTasha is Created Successfully.`;
      const transporter = nodeMailer.createTransport({
        service: process.env.SMTP_SERVICE,
        auth: {
          user: process.env.SMTP_MAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      try {
        let info = await transporter.sendMail(
          {
            from: process.env.SMTP_SERVICE,
            to: newCustomer.email,
            subject: "Customer Account created",
            html: message,
          },
          function (err, info) {
            if (err) throw err;
            res.status(250).json({
              success: true,
              message: `Email send to ${newCustomer.email} successfully`,
            });
          }
        );
  
        // res.status(200).json({success: true,message: `Email send to ${newCustomer.email} successfully`,});
      } catch (err) {
        // console.log("err", err);
      }
  
      res
        .status(201)
        .json({ success: true, message: "Customer Registered Successfully." });
    } catch (err) {
      const errors = handleErrors(err);
      res.status(400).json({ errors });
    }
  };

// sign up
module.exports.signup_admin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const customer = await Customer.create({ email, password });
    const token = createToken(admin._id);
    res.status(201).json({ admin, usertype: "customer", token, success: true });
  } catch (err) {
    const error = handleErrors(err);
    res.status(400).json({ error, success: false });
  }
};

// login customer
module.exports.login_customer = async (req, res) => {
  const { email, password } = req.body;
  try {
    const customer = await Customer.login(email, password);
    const token = createToken(customer._id);
    res.status(200).json({ customer, usertype: "customer", token, success: true });
  } catch (err) {
    const error = handleErrors(err);
    res.status(400).json({ success: false, error: error });
  }
};

// logout customer
module.exports.logout_customer = (req, res) => {
  req.customer._id = "";
  res.cookie("token", "", { maxAge: 1 });
  res.cookie("usertype", "", { maxAge: 1 });
  res.send({ success: true, message: "Customer Logged Out." });
};

// customer profile
module.exports.customer_profile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id).populate({
      path: "applications",
    });
    if (!customer) {
      return res.status(400).json({ success: false, message: "Customer not found" });
    }
    res.status(200).json({ customer, success: true });
  } catch {
    res.status(400).json({ success: false, message: "Login or Signup" });
  }
};

// customer reset Password
module.exports.customer_reset_password = async (req, res) => {
  //passing in query not in params
  // console.log("query", req.query);
  // console.log()

  const customer = await Customer.findOne({ _id: req.query.id });
  const isValid = await bcrypt.compare(
    req.query.token,
    customer.resetPasswordToken
  );

  // console.log("isValid", isValid);

  if (!isValid) {
    return res.status(400).json({
      success: false,
      msg: "Reset password token is invalid or has been expired",
    });
  }

  customer.password = req.body.newPassword;
  customer.resetPasswordToken = undefined;
  customer.resetPasswordExpire = undefined;

  await customer.save();

  //JWT_SECRET is a string -> parse it to integer
  const token = jwt.sign({ id: customer._id }, process.env.JWT_SECRET, {
    expiresIn: parseInt(process.env.UPDATE_PASSWORD_AGE),
  });

  // option for cookie
  const options = {
    expires: new Date(
      Date.now() + parseInt(process.env.UPDATE_PASSWORD_AGE) * 1000 //1000 for milliseconds
    ),
    httpOnly: true,
  };

  res.status(200).cookie("token", token, options).json({
    success: true,
    customer,
    token,
  });
};

// customer forgot Password
module.exports.customer_forgot_password = async (req, res) => {
  try {
    const customer = await Customer.findOne({ email: req.body.email });

    if (!customer) {
      return res.status(404).send("customer not found");
    }

    // generating token
    const resetToken = crypto.randomBytes(32).toString("hex");

    //generates salt
    const salt = await bcrypt.genSalt(8);

    const resetPasswordToken = await bcrypt.hash(resetToken, salt);

    //storing HASHED password in customer db, not token
    customer.resetPasswordToken = resetPasswordToken;

    customer.resetPasswordExpire = Date.now() + 15 * 60 * 1000; //15 minutes from now

    await customer.save({ validateBeforeSave: false });
    // console.log('customer after saving', customer);
    // console.log("resetToken", resetToken);
    // now send email
    // const resetPasswordUrl = `${req.protocol}://${req.get("host")}/resetPassword?token=${resetToken}&id=${user._id}`;
    const resetPasswordUrl = `http://localhost:3000/customer/password/reset/${resetToken}/${customer.id}`;

    // const message = `Your reset password token is:- \n\n <form action=${resetPasswordUrl} method="post">
    //     <input type="text" name="newPassword2" placeholder="Enter New password" />
    // <button type="submit">Click</button></form> \n\n If you have not requested this mail then please contact PICT TnP cell`;

    const message = `Your reset password token is:- \n\n <a href=${resetPasswordUrl}>click here</a> \n\n If you have not reque`;

    const transporter = nodeMailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    let info = await transporter.sendMail(
      {
        from: process.env.SMTP_SERVICE,
        to: customer.email,
        subject: "Password Recovery checking 1",
        // text: message,
        html: message,
      },
      function (err, info) {
        if (err) throw err;
        // console.log(
        //   "response:",
        //   info.response,
        //   " Message sent: %s",
        //   info.messageId
        // );
        // 250 Requested mail action okay, completed
        res.status(250).json({
          success: true,
          message: `Email send to ${customer.email} successfully`,
        });
      }
    );

    // res.status(200).json({
    //   success: true,
    //   message: `Email send to ${customer.email} successfully`,
    // });

    // console.log("Message sent: %s", info.messageId);
  } catch (error) {
    customer.resetPasswordToken = undefined;
    customer.resetPasswordToken = undefined;
    await customer.save({ validateBeforeSave: false });
    // console.log("error in customer forgot pass", error);
  }
};

// customer reset Password
module.exports.customer_update_password = async (req, res) => {
  const customer = await Customer.findById(req.customer._id);

  const isPasswordMatched = await bcrypt.compare(
    req.body.oldPassword,
    customer.password
  );

  if (!isPasswordMatched) {
    return res.status(403).send("Passwords do not match");
  }

  // frontend compare newpassword with confirm password

  customer.password = req.body.newPassword;

  await customer.save();

  res.status(200).json({ success: true, message: "Password Updated." });
};


module.exports.event_details = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "Event Not Found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Event Found", data: event });
  } catch (err) {
    res.status(400).json({ errors: err, success: false });
  }
};





