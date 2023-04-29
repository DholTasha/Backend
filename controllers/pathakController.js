const Pathak = require("../models/pathak");
const Customer = require("../models/customer");
const jwt = require("jsonwebtoken");
const Event = require("../models/event");
const nodeMailer = require("nodemailer");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");
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

// maxtime for which token is active
const tokenAge = parseInt(process.env.JWT_AGE);

// sign up
module.exports.signup_pathak = async (req, res) => {
  try {
      const pathak = await Pathak.create(req.body);
      const token = createToken(pathak._id);
      res.status(201).json({ pathak, usertype: "pathak", token, success: true });
  } catch (err) {
      const error = handleErrors(err);
      res.status(400).json({ error, success: false });
  }
};

// login pathak
module.exports.login_pathak = async (req, res) => {
    const { email, password } = req.body;
    try {
        let pathak = await Pathak.login(email, password);
        const token = createToken(pathak._id);
        pathak = await Pathak.findById(pathak);
        res.status(200).json({ pathak, usertype: "pathak", token, success: true });
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json({ error, success: false });
    }
};

// logout pathak
module.exports.logout_pathak = (req, res) => {
    req.pathak._id = "";
    res.send({ success: true, message: "Logged Out." });
};

//Update pathak
module.exports.pathak_update = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "location", "maleDhol", "femaleDhol", "maleTasha", "femaleTasha", "videoLink", "address", "videoLink", "mobile"];
  const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
      return res.status(400).send({ msg: "Invalid updates!" });
  }

  try {
      const pathak = await Pathak.findOne({
          _id: req.pathak._id,
      });

      if (!pathak) {
          return res.status(404).send();
      }

      updates.forEach((update) => (pathak[update] = req.body[update]));
      await pathak.save();
      res.send(pathak);
  } catch (e) {
      res.status(400).send(e);
  }
};

//get all pathaks
module.exports.get_all_pathak = async(req,res) => {
    try {
      const pathak = await Pathak.find();
      if (!pathak) {
        return res.status(400).json({ success: false, message: "Pathak not found" });
      }
      res.status(200).json({ pathak, success: true });
    }catch {
      res.status(400).json({ success: false, message: "Error" });
    }
};

//get pathak events
module.exports.get_pathak_events = async(req,res) => {
  const pathakId = req.pathak._id;
  try {
    const events = await Event.find({pathakId});
    if (!events) {
      return res.status(400).json({ success: false, message: "Pathak not found" });
    }
    res.status(200).json({ events, success: true });
  }catch {
    res.status(400).json({ success: false, message: "Error" });
  }
};

//get other pathak event
module.exports.get_other_pathak_events = async(req,res) => {
    const pathakId = req.params.pathakId;
    try {
      const events = await Event.find({pathakId});
      if (!events) {
        return res.status(400).json({ success: false, message: "Pathak not found" });
      }
      res.status(200).json({ events, success: true });
    }catch {
      res.status(400).json({ success: false, message: "Error" });
    }
};

//display pathak details
module.exports.pathak_profile = async(req,res) => {
  try {
    const pathak = await Pathak.findById(req.pathak._id);
    if (!pathak) {
      return res.status(400).json({ success: false, message: "Pathak not found" });
    }
    res.status(200).json({ pathak, success: true });
  } catch {
    res.status(400).json({ success: false, message: "Login or Signup" });
  }
}

// delete pathak
module.exports.pathak_delete = async(req,res) => {
  try {
    const pathak = await Pathak.findByIdAndDelete(req.pathak._id);
    if (!pathak) {
      return res.status(400).json({ success: false, message: "Pathak not found" });
    }
    res.status(200).json({ message: "Pathak deleted successfully", success: true });
  }catch {
    res.status(400).json({ success: false, message: "Error" });
  }
};


// // upate password
// module.exports.pathak_update_password = async (req, res) => {
//     const pathak = await Pathak.findById(req.pathak._id);

//     const isPasswordMatched = await bcrypt.compare(
//         req.body.oldPassword,
//         pathak.password
//     );

//     if (!isPasswordMatched) {
//         return res.status(403).send("Passwords do not match");
//     }

//     // frontend compare newpassword with confirm password

//     pathak.password = req.body.newPassword;

//     await pathak.save();

//     res.status(200).json({ success: true, message: "Password Updated." });
// };

// // pathak reset Password
// module.exports.pathak_reset_password = async (req, res) => {
//     //passing in query not in params
//     // console.log('query', req.query);

//     const pathak = await Pathak.findOne({ _id: req.query.id });
//     const isValid = await bcrypt.compare(
//         req.query.token,
//         pathak.resetPasswordToken
//     );

//     if (!isValid) {
//         return res.send("Reset password token is invalid or has been expired", 400);
//     }

//     pathak.password = req.body.newPassword;
//     pathak.resetPasswordToken = undefined;
//     pathak.resetPasswordExpire = undefined;

//     await pathak.save();

//     //JWT_SECRET is a string -> parse it to integer
//     const token = jwt.sign({ id: pathak._id }, process.env.JWT_SECRET, {
//         expiresIn: parseInt(process.env.UPDATE_PASSWORD_AGE) * 1000,
//     });

//     // option for cookie
//     const options = {
//         expires: new Date(
//             Date.now() + parseInt(process.env.UPDATE_PASSWORD_AGE) * 1000 //1000 for milliseconds
//         ),
//         httpOnly: true,
//     };

//     res.status(200).cookie("token", token, options).json({
//         success: true,
//         pathak,
//         token,
//     });
// };

// // pathak forgot Password
// module.exports.pathak_forgot_password = async (req, res) => {
//     const pathak = await Pathak.findOne({ email: req.body.email });

//     if (!pathak) {
//         return res.status(404).send("pathak not found");
//     }

//     // generating token
//     const resetToken = crypto.randomBytes(32).toString("hex");

//     //generates salt
//     const salt = await bcrypt.genSalt(8);

//     const resetPasswordToken = await bcrypt.hash(resetToken, salt);

//     //storing HASHED password in pathak db, not token
//     pathak.resetPasswordToken = resetPasswordToken;

//     pathak.resetPasswordExpire = Date.now() + 15 * 60 * 1000; //15 minutes from now

//     await pathak.save({ validateBeforeSave: false });
//     // console.log("resetToken", resetToken);
//     // now send email
//     // const resetPasswordUrl = `${req.protocol}://${req.get("host")}/resetPassword?token=${resetToken}&id=${user._id}`;
//     const resetPasswordUrl = `http://localhost:3000/pathak/password/reset/${resetToken}/${pathak.id}`;

//     const message = `Your reset password token is:- \n\n <a href=${resetPasswordUrl}>click here</a> \n\n If you have not reque
//   sted please ignore this mail`;

//     const transporter = nodeMailer.createTransport({
//         service: process.env.SMTP_SERVICE,
//         auth: {
//             user: process.env.SMTP_MAIL,
//             pass: process.env.SMTP_PASSWORD,
//         },
//     });

//     try {
//         let info = await transporter.sendMail(
//             {
//                 from: process.env.SMTP_SERVICE,
//                 to: pathak.email,
//                 subject: "Password Recovery checking Pathak",
//                 // text: message,
//                 html: message,
//             },
//             function (err, info) {
//                 if (err) throw err;
//                 // console.log(
//                 //   "response:",
//                 //   info.response,
//                 //   " Message sent: %s",
//                 //   info.messageId
//                 // );
//                 // 250 Requested mail action okay, completed
//                 res.status(250).json({
//                     success: true,
//                     message: `Email send to ${pathak.email} successfully`,
//                 });
//             }
//         );

//         // res.status(200).json({success: true,message: `Email send to ${pathak.email} successfully`,});

//         // console.log("Message sent: %s", info.messageId);
//     } catch (error) {
//         pathak.resetPasswordToken = undefined;
//         pathak.resetPasswordToken = undefined;
//         await pathak.save({ validateBeforeSave: false });

//         // console.log(error);
//     }
// };

// get Event Job
// module.exports.get_job = async (req, res) => {
//     try {
//         let job = await Job.findById(req.params.jobId).populate("event");
//         if (!job) {
//             return res.status(404).json({ success: true, message: "Job not found" })
//         }
//         res.status(200).json({
//             success: true,
//             data: job,
//             message: "Job & Event found"
//         })
//     } catch (err) {
//         // console.log(err);
//         res.status(404).json({ succss: false, message: "Job not found" })
//     }
// }

// module.exports.get_event_jobs = async (req, res) => {
//     try {
//         const eventList = await Event.find().populate({
//             path: "jobDescriptions",
//         });
//         res.status(200).json({
//             success: true,
//             message: "current companies drive",
//             data: eventList,
//         });
//     } catch (err) {
//         res.status(400).json({
//             success: false,
//             error: err,
//             message: "Error while getting the event jobs",
//         });
//     }
// };