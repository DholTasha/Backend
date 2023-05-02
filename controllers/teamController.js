const Team = require("../models/team");
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
module.exports.signup_team = async (req, res) => {
  try {
      const team = await Team.create(req.body);
      const token = createToken(team._id);
      res.status(201).json({ team, usertype: "team", token, success: true });
  } catch (err) {
      const error = handleErrors(err);
      res.status(400).json({ error, success: false });
  }
};

// login team
module.exports.login_team = async (req, res) => {
    const { email, password } = req.body;
    try {
        let team = await Team.login(email, password);
        const token = createToken(team._id);
        team = await Team.findById(team);
        res.status(200).json({ team, usertype: "team", token, success: true });
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json({ error, success: false });
    }
};

// logout team
module.exports.logout_team = (req, res) => {
    req.team._id = "";
    res.send({ success: true, message: "Logged Out." });
};

//Update team
module.exports.team_update = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "location", "maleDhol", "femaleDhol", "maleTasha", "femaleTasha", "videoLink", "address", "videoLink", "mobile"];
  const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
      return res.status(400).send({ msg: "Invalid updates!" });
  }

  try {
      const team = await Team.findOne({
          _id: req.team._id,
      });

      if (!team) {
          return res.status(404).send();
      }

      updates.forEach((update) => (team[update] = req.body[update]));
      await team.save();
      res.send(team);
  } catch (e) {
      res.status(400).send(e);
  }
};

//get all teams
module.exports.get_all_team = async(req,res) => {
    try {
      const team = await Team.find();
      if (!team) {
        return res.status(400).json({ success: false, message: "Team not found" });
      }
      res.status(200).json({ team, success: true });
    }catch {
      res.status(400).json({ success: false, message: "Error" });
    }
};

//get team events
module.exports.get_team_events = async(req,res) => {
  const teamId = req.team._id;
  try {
    const events = await Event.find({teamId});
    if (!events) {
      return res.status(400).json({ success: false, message: "Team not found" });
    }
    res.status(200).json({ events, success: true });
  }catch {
    res.status(400).json({ success: false, message: "Error" });
  }
};

//get other team event
module.exports.get_other_team_events = async(req,res) => {
    const teamId = req.params.teamId;
    try {
      const events = await Event.find({teamId});
      if (!events) {
        return res.status(400).json({ success: false, message: "Team not found" });
      }
      res.status(200).json({ events, success: true });
    }catch {
      res.status(400).json({ success: false, message: "Error" });
    }
};

//display team details
module.exports.team_profile = async(req,res) => {
  try {
    const team = await Team.findById(req.team._id);
    if (!team) {
      return res.status(400).json({ success: false, message: "Team not found" });
    }
    res.status(200).json({ team, success: true });
  } catch {
    res.status(400).json({ success: false, message: "Login or Signup" });
  }
}

// delete team
module.exports.team_delete = async(req,res) => {
  try {
    const team = await Team.findByIdAndDelete(req.team._id);
    if (!team) {
      return res.status(400).json({ success: false, message: "Team not found" });
    }
    res.status(200).json({ message: "Team deleted successfully", success: true });
  }catch {
    res.status(400).json({ success: false, message: "Error" });
  }
};


// // upate password
// module.exports.team_update_password = async (req, res) => {
//     const team = await Team.findById(req.team._id);

//     const isPasswordMatched = await bcrypt.compare(
//         req.body.oldPassword,
//         team.password
//     );

//     if (!isPasswordMatched) {
//         return res.status(403).send("Passwords do not match");
//     }

//     // frontend compare newpassword with confirm password

//     team.password = req.body.newPassword;

//     await team.save();

//     res.status(200).json({ success: true, message: "Password Updated." });
// };

// // team reset Password
// module.exports.team_reset_password = async (req, res) => {
//     //passing in query not in params
//     // console.log('query', req.query);

//     const team = await Team.findOne({ _id: req.query.id });
//     const isValid = await bcrypt.compare(
//         req.query.token,
//         team.resetPasswordToken
//     );

//     if (!isValid) {
//         return res.send("Reset password token is invalid or has been expired", 400);
//     }

//     team.password = req.body.newPassword;
//     team.resetPasswordToken = undefined;
//     team.resetPasswordExpire = undefined;

//     await team.save();

//     //JWT_SECRET is a string -> parse it to integer
//     const token = jwt.sign({ id: team._id }, process.env.JWT_SECRET, {
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
//         team,
//         token,
//     });
// };

// // team forgot Password
// module.exports.team_forgot_password = async (req, res) => {
//     const team = await Team.findOne({ email: req.body.email });

//     if (!team) {
//         return res.status(404).send("team not found");
//     }

//     // generating token
//     const resetToken = crypto.randomBytes(32).toString("hex");

//     //generates salt
//     const salt = await bcrypt.genSalt(8);

//     const resetPasswordToken = await bcrypt.hash(resetToken, salt);

//     //storing HASHED password in team db, not token
//     team.resetPasswordToken = resetPasswordToken;

//     team.resetPasswordExpire = Date.now() + 15 * 60 * 1000; //15 minutes from now

//     await team.save({ validateBeforeSave: false });
//     // console.log("resetToken", resetToken);
//     // now send email
//     // const resetPasswordUrl = `${req.protocol}://${req.get("host")}/resetPassword?token=${resetToken}&id=${user._id}`;
//     const resetPasswordUrl = `http://localhost:3000/team/password/reset/${resetToken}/${team.id}`;

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
//                 to: team.email,
//                 subject: "Password Recovery checking Team",
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
//                     message: `Email send to ${team.email} successfully`,
//                 });
//             }
//         );

//         // res.status(200).json({success: true,message: `Email send to ${team.email} successfully`,});

//         // console.log("Message sent: %s", info.messageId);
//     } catch (error) {
//         team.resetPasswordToken = undefined;
//         team.resetPasswordToken = undefined;
//         await team.save({ validateBeforeSave: false });

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