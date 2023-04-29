const Pathak = require("../models/pathak");
const Customer = require("../models/customer");
const jwt = require("jsonwebtoken");
const Event = require("../models/event");
const nodeMailer = require("nodemailer");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Job = require("../models/job");
const Application = require("../models/application");
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
  const { email, password } = req.body;

  try {
    const pathak = await Pathak.create({ email, password });
    const token = createToken(pathak._id);
    res.cookie("token", token, { httpOnly: true, maxAge: maxAge * 1000 }); //3 days
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
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
    }); // 3 days
    res.status(200).json({ pathak, usertype: "pathak", token, success: true });
  } catch (err) {
    const error = handleErrors(err);
    res.status(400).json({ error, success: false });
  }
};

// logout pathak
module.exports.logout_pathak = (req, res) => {
  req.pathak._id = "";
  res.cookie("token", "", { maxAge: 1 });
  res.cookie("usertype", "", { maxAge: 1 });
  res.send({ success: true, message: "Logged Out." });
};

// upate password
module.exports.pathak_update_password = async (req, res) => {
  const pathak = await Pathak.findById(req.pathak._id);

  const isPasswordMatched = await bcrypt.compare(
    req.body.oldPassword,
    pathak.password
  );

  if (!isPasswordMatched) {
    return res.status(403).send("Passwords do not match");
  }

  // frontend compare newpassword with confirm password

  pathak.password = req.body.newPassword;

  await pathak.save();

  res.status(200).json({ success: true, message: "Password Updated." });
};

// pathak reset Password
module.exports.pathak_reset_password = async (req, res) => {
  //passing in query not in params
  // console.log('query', req.query);

  const pathak = await Pathak.findOne({ _id: req.query.id });
  const isValid = await bcrypt.compare(
    req.query.token,
    pathak.resetPasswordToken
  );

  if (!isValid) {
    return res.send("Reset password token is invalid or has been expired", 400);
  }

  pathak.password = req.body.newPassword;
  pathak.resetPasswordToken = undefined;
  pathak.resetPasswordExpire = undefined;

  await pathak.save();

  //JWT_SECRET is a string -> parse it to integer
  const token = jwt.sign({ id: pathak._id }, process.env.JWT_SECRET, {
    expiresIn: parseInt(process.env.UPDATE_PASSWORD_AGE) * 1000,
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
    pathak,
    token,
  });
};

// pathak forgot Password
module.exports.pathak_forgot_password = async (req, res) => {
  const pathak = await Pathak.findOne({ email: req.body.email });

  if (!pathak) {
    return res.status(404).send("pathak not found");
  }

  // generating token
  const resetToken = crypto.randomBytes(32).toString("hex");

  //generates salt
  const salt = await bcrypt.genSalt(8);

  const resetPasswordToken = await bcrypt.hash(resetToken, salt);

  //storing HASHED password in pathak db, not token
  pathak.resetPasswordToken = resetPasswordToken;

  pathak.resetPasswordExpire = Date.now() + 15 * 60 * 1000; //15 minutes from now

  await pathak.save({ validateBeforeSave: false });
  // console.log("resetToken", resetToken);
  // now send email
  // const resetPasswordUrl = `${req.protocol}://${req.get("host")}/resetPassword?token=${resetToken}&id=${user._id}`;
  const resetPasswordUrl = `http://localhost:3000/pathak/password/reset/${resetToken}/${pathak.id}`;

  const message = `Your reset password token is:- \n\n <a href=${resetPasswordUrl}>click here</a> \n\n If you have not reque
  sted please ignore this mail`;

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
        to: pathak.email,
        subject: "Password Recovery checking Pathak",
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
          message: `Email send to ${pathak.email} successfully`,
        });
      }
    );

    // res.status(200).json({success: true,message: `Email send to ${pathak.email} successfully`,});

    // console.log("Message sent: %s", info.messageId);
  } catch (error) {
    pathak.resetPasswordToken = undefined;
    pathak.resetPasswordToken = undefined;
    await pathak.save({ validateBeforeSave: false });

    // console.log(error);
  }
};



module.exports.register_customers = async (req, res) => {
  const customers = req.body;
  let array = [];
  try {
    customers.forEach(async (customer) => {
      await Customer.create(customer);
    });

    customers.forEach((customer) => {
      array.push(customer.email);
    });

    // console.log(array);

    const transporter = nodeMailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const message = `Your TnP account has been created suceesfully \n\n Your password is your mobile Number `;

    let mailOptions = {
      from: process.env.SMTP_SERVICE,
      to: array,
      subject: "Final checking Latest",
      html: message,
    };

    // send response in another function after mailOptions else gives cant set headers after they're sent to the client error
    try {
      let info = await transporter.sendMail(mailOptions, function (err, info) {
        if (err) throw err;
        // console.log(
        //   "status: ",
        //   info.response,
        //   " Message sent: %s",
        //   info.messageId
        // );
        // 250 Requested mail action okay, completed
        res.status(250).json({
          success: true,
          message: `Email send to ${array} successfully`,
        });
      });
    } catch (err) {
      // console.log("err in coll reg", err);
    }

    // here dont send res as it gives cant set headers after they're sent to the client
    // res.status(200).json({success: true,message: `Email send to ${array} successfully`,});
    // res.status(201).send({ success: true, message: "All Customers Registered Successfully." });
  } catch (err) {
    // const errors = handleErrors(err);
    res.status(400).json({ errors, success: false });
    // console.log('err in last clasuse', err)
  }
};

// get Event Job
module.exports.get_job = async (req, res) => {
  try {
    let job = await Job.findById(req.params.jobId).populate("event");
    if (!job) {
      return res.status(404).json({ success: true, message: "Job not found" })
    }
    res.status(200).json({
      success: true,
      data: job,
      message: "Job & Event found"
    })
  } catch (err) {
    // console.log(err);
    res.status(404).json({ succss: false, message: "Job not found" })
  }
}

module.exports.get_event_jobs = async (req, res) => {
  try {
    const eventList = await Event.find().populate({
      path: "jobDescriptions",
    });
    res.status(200).json({
      success: true,
      message: "current companies drive",
      data: eventList,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
      message: "Error while getting the event jobs",
    });
  }
};

module.exports.get_customer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId).populate({ path: "applications", populate: { path: "job", populate: { path: "event" } } });
    if (!customer) {
      return res
        .status(400)
        .json({ success: false, message: "Customer Not Found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Customer Found", data: customer });
  } catch (err) {
    res.status(400).json({ errors: err, success: false });
  }
};

module.exports.get_all_customers = async (req, res) => {
  try {
    const customerList = await Customer.find();
    return res
      .status(200)
      .json({ success: true, message: "Customer List", data: customerList });
  } catch (err) {
    res.status(400).json({ errors: err, success: false });
  }
};

module.exports.get_dashboard_details = async (req, res) => {
  try {
    const dashboard_details = {
      totalCustomers: 0,
      csPlacedCustomers: 0,
      itPlacedCustomers: 0,
      entcPlacedCustomers: 0,
      totalCompanies: 0,
      placedCustomers: 0,
      unplacedCustomers: 0,
      avgSalaryBaggedByPlacedCustomers: 0,
      avgSalaryBaggedByAllCustomers: 0,
    };

    dashboard_details.totalCustomers = (await Customer.find()).length;
    dashboard_details.totalCompanies = (await Event.find()).length;
    dashboard_details.csPlacedCustomers = (await Customer.find({
      $and: [
        {
          branch: { $eq: "cs" }
        },
        {
          $or:
            [
              { "LTE20.status": { $eq: true } },
              { "GT20.status": { $eq: true } },
            ]
        }
      ]
    })).length;

    dashboard_details.itPlacedCustomers = (await Customer.find({
      $and: [
        {
          branch: { $eq: "it" }
        },
        {
          $or:
            [
              { "LTE20.status": { $eq: true } },
              { "GT20.status": { $eq: true } },
            ]
        }
      ]
    })).length;

    dashboard_details.entcPlacedCustomers = (await Customer.find({
      $and: [
        {
          branch: { $eq: "entc" }
        },
        {
          $or:
            [
              { "LTE20.status": { $eq: true } },
              { "GT20.status": { $eq: true } },
            ]
        }
      ]
    })).length;

    let totalSalaryOfferedByAllJobs = 0;

    // finding average ctc offered
    let jobs = await Job.find().populate("event");
    for (let i = 0; i < jobs.length; i++) {
      let job = jobs[i];
      let totalPlacedCustomers = 0;

      let jobCtc = job.ctc;
      const data = await Application.find({ jobId: { $eq: job._id } }).populate("customer")
      if(!data){
        // console.log("No applicants to this job");
      }else{

        if (jobCtc > 20) {
            {
            for (let i = 0; i < data.length; i++) {
              let customer = data[i];
              let customersList = (customer.customer);
              if (customersList[0].GT20.status && JSON.stringify(customersList[0].GT20.jobId) === JSON.stringify(job._id)) {
                totalPlacedCustomers++;
              }
            }
            totalSalaryOfferedByAllJobs += totalPlacedCustomers * jobCtc;
          }
        } else {
          {
            for (let i = 0; i < data.length; i++) {
              let customer = data[i];
              let customersList = (customer.customer);
              if (!customersList[0].GT20.status && customersList[0].LTE20.status && JSON.stringify(customersList[0].LTE20.jobId) === JSON.stringify(job._id)) {
                totalPlacedCustomers++;
              }
            }
            totalSalaryOfferedByAllJobs += totalPlacedCustomers * jobCtc;
          }
        }
      }
      // totalSalaryOfferedByAllJobs += totalPlacedCustomers * jobCtc;
      dashboard_details.avgSalaryBaggedByPlacedCustomers = (totalSalaryOfferedByAllJobs / (dashboard_details.csPlacedCustomers + dashboard_details.itPlacedCustomers + dashboard_details.entcPlacedCustomers));
      dashboard_details.avgSalaryBaggedByAllCustomers = (totalSalaryOfferedByAllJobs / dashboard_details.totalCustomers);
    }


    dashboard_details.placedCustomers = (dashboard_details.csPlacedCustomers + dashboard_details.itPlacedCustomers + dashboard_details.entcPlacedCustomers);
    dashboard_details.unplacedCustomers = dashboard_details.totalCustomers - dashboard_details.placedCustomers;
    res.status(200).json({ success: true, dashboard_details });
  } catch (err) {
    // console.log(err);
    res.status(400).json({ errors: err, success: false });
  }
};

module.exports.get_job_round_applied_customers = async (req, res) => {
  const { jobId, roundNo } = req.params;
  try {
    Job.findById(jobId)
      .populate({ path: "jobApplications" })
      .exec(async function (err, job) {
        const customerIds = [];
        // console.log(job);
        job.jobApplications.map((application) => {
          if (application.customerRoundCleared >= roundNo - 1) {
            customerIds.push(application.customerId);
          }
        });
        const data = await Customer.find({ _id: { $in: customerIds } });
        res.status(200).json({
          success: true,
          data,
          message: `Applied Customers of Round ${roundNo}.`,
        });
      });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
      message: "Error while getting Applied Customers",
    });
  }
};

module.exports.get_job_round_qualified_customers = async (req, res) => {
  const { jobId, roundNo } = req.params;
  try {
    Job.findById(jobId)
      .populate({ path: "jobApplications" })
      .exec(async function (err, job) {
        const customerIds = [];
        job.jobApplications.map((application) => {
          if (application.customerRoundCleared >= roundNo) {
            customerIds.push(application.customerId);
          }
        });
        const data = await Customer.find({ _id: { $in: customerIds } });
        res.status(200).json({
          success: true,
          data,
          message: `Qualified Customers of Round ${roundNo}.`,
        });
      });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
      message: "Error while getting Disqualified Customers",
    });
  }
};

module.exports.get_job_round_disqualified_customers = async (req, res) => {
  const { jobId, roundNo } = req.params;
  try {
    Job.findById(jobId)
      .populate({ path: "jobApplications" })
      .exec(async function (err, job) {
        const customerIds = [];
        job.jobApplications.map((application) => {
          if (
            application.customerRoundCleared == roundNo - 1 &&
            application.customerResult == false
          ) {
            customerIds.push(application.customerId);
          }
        });
        const data = await Customer.find({ _id: { $in: customerIds } });
        res.status(200).json({
          success: true,
          data,
          message: `Disqualified Customers of Round ${roundNo}.`,
        });
      });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
      message: "Error while getting Disqualified Customers",
    });
  }
};

//
//Generate placed customer Report list,excel:

module.exports.get_placed_customers = async (req, res) => {
  let customers = await Customer.find({
    $or: [{ "LTE20.status": { $eq: true } }, { "GT20.status": { $eq: true } }],
  });

  if (!customers) {
    return res
      .status(404)
      .json({ success: false, message: "No Customer Found!" });
  }

  return res
    .status(200)
    .json({ success: true, message: "List of customers", data: customers });
};

// generate report
module.exports.generate_report = async (req, res) => {
  try {
    const reportArr = [];

    let jobs = await Job.find().populate("event");

    for (let i = 0; i < jobs.length; i++) {
      let job = jobs[i];
      let obj = {};
      let maleCustomersCount = 0;
      let femaleCustomersCount = 0;
      let totalCustomersCount = 0;
      let ugCsCustomersCount = 0;
      let ugItCustomersCount = 0;
      let ugEntcCustomersCount = 0;
      let pgCsCustomersCount = 0;
      let pgItCustomersCount = 0;
      let pgEntcCustomersCount = 0;
      // console.log(`job[${i + 1}]=>`, jobs[i]);
      let jobCriteriaUG = job.criteria.ug;
      let jobCriteriaPG = job.criteria.pg;
      let jobCriteriaGender = job.criteria.gender;
      const event = await Event.findById(job.eventId);
      obj.eventName = event.name;

      const cgpa = job.criteria.engCgpa ? job.criteria.engCgpa : "NC";
      obj.cgpa = cgpa;
      // todo UG and PG => branch criteria - handle(-ug and ce,it -pg)
      {

        // 1. all ug & pg
        if (jobCriteriaUG.cs && jobCriteriaUG.it && jobCriteriaUG.entc && jobCriteriaPG.cs && jobCriteriaPG.it && jobCriteriaPG.entc) {
          obj.branches = "All (UG and PG)";
        }
        // 2. all ug
        else if (jobCriteriaUG.cs && jobCriteriaUG.it && jobCriteriaUG.entc) {
          obj.branches = "All (UG)";
        }
        // 3. all PG
        else if (jobCriteriaPG.cs && jobCriteriaPG.it && jobCriteriaPG.entc) {
          obj.branches = "All (PG)";
        }
        // 4. all ug & pg(ce,it)
        else if (jobCriteriaUG.cs && jobCriteriaUG.it && jobCriteriaUG.entc && (jobCriteriaPG.cs || jobCriteriaPG.it || jobCriteriaPG.entc)) {
          obj.branches = "All (UG) and";
          if (jobCriteriaPG.cs) {
            obj.branches += " CE "
          }
          if (jobCriteriaPG.it) {
            obj.branches += " IT "
          }
          if (jobCriteriaPG.entc) {
            obj.branches += " ENTC "
          }
          obj.branches += "(PG)"
        }
        // all pg and ug(ce, it)
        else if ((jobCriteriaUG.cs || jobCriteriaUG.it || jobCriteriaUG.entc) && (jobCriteriaPG.cs && jobCriteriaPG.it && jobCriteriaPG.entc)) {
          obj.branches = "(";
          if (jobCriteriaUG.cs) {
            obj.branches += " CE "
          }
          if (jobCriteriaUG.it) {
            obj.branches += " IT "
          }
          if (jobCriteriaUG.entc) {
            obj.branches += " ENTC "
          }
          obj.branches += "- (UG) & ALL (PG)"
        }
        else {
          // 5. ug(ce,it) & pg(ce,it)
          obj.branches = "";
          if (jobCriteriaUG.cs) {
            obj.branches += " CE "
          }
          if (jobCriteriaUG.it) {
            obj.branches += " IT "
          }
          if (jobCriteriaUG.entc) {
            obj.branches += " ENTC "
          }
          obj.branches += "-(UG) & "
          if (jobCriteriaPG.cs) {
            obj.branches += " CE "
          }
          if (jobCriteriaPG.it) {
            obj.branches += " IT "
          }
          if (jobCriteriaPG.entc) {
            obj.branches += " ENTC "
          }
          obj.branches += "-(PG)"
        }
      }
      // const eventwisePlacedCustomerList = await
      // * salary 
      obj.salary = job.ctc

      // * visit date
      obj.visitDate = job.roundDetails[0].date;

      // * for finding no of placed customers
      // await Applications.find({jobId: {$eq: job._id}}).populate("customer").exec(async function(err, data){
      //   for(let i=0; i<data.length; i++){
      //     let customer = data[i];
      //     let customersList = (customer.customer);
      //     // if(customer)
      //   }
      // })

      obj.male = 0
      obj.female = 0
      obj.total = 0
      obj.ugCsCustomersCount = 0
      obj.ugItCustomersCount = 0
      obj.ugEntcCustomersCount = 0
      obj.pgCsCustomersCount = 0
      obj.pgItCustomersCount = 0
      obj.pgEntcCustomersCount = 0
      obj.totalSalaryOfferedByJob = 0
      // * for gt20
      if (job.ctc > 20) {
        // * for finding no of placed customers and also forFor Female, Male & total
        const data = await Application.find({ jobId: { $eq: job._id } }).populate("customer")
        // .exec(async function (err, data) {
        // if (err) {
        // return res.status(404).json({ success: false, message: "Application not found", errors: err })
        // console.log('err in totalAppliedForJob', err);
        // } else {
        // const maleCustomers = await data.find();
        // console.log('male customers',data[0])
        if (!data.length) {
          // console.log(`job ctc>20, but no this job does not have any application `, data);
        } else {

          for (let i = 0; i < data.length; i++) {
            let customer = data[i];

            // console.log('customer.gender',JSON.stringify(customer.customer));
            let customersList = (customer.customer);
            // if(customersList[0].gender == "male"){
            //   maleCustomersCount++;
            // }else{
            //   femaleCustomersCount++;
            // }
            // console.log('customersList',customersList[0].gender)
            // console.log('customersList[0].LTE20.jobId == job._id for ',JSON.stringify(customersList[0].LTE20.jobId)," ", JSON.stringify(job._id))
            if (customersList[0].GT20.status && JSON.stringify(customersList[0].GT20.jobId) === JSON.stringify(job._id)) {
              // console.log('customersList[0].gender == male for ',JSON.stringify(customersList[0].gender))
              if (customersList[0].gender == "male") {
                maleCustomersCount++;
              } else {
                femaleCustomersCount++;
              }

              // * now checking for course and department
              if (customersList[0].isUg) {
                // let ugCsCustomersCount = 0;
                // let ugItCustomersCount = 0;
                // let ugEntcCustomersCount = 0;
                if (customersList[0].branch == "cs") {
                  ugCsCustomersCount++;
                } else if (customersList[0].branch == "it") {
                  ugItCustomersCount++;
                } else if (customersList[0].branch == "entc") {
                  ugEntcCustomersCount++;
                }
              } else {
                // let pgCsCustomersCount = 0;
                // let pgItCustomersCount = 0;
                // let pgEntcCustomersCount = 0;
                if (customersList[0].branch == "cs") {
                  pgCsCustomersCount++;
                } else if (customersList[0].branch == "it") {
                  pgItCustomersCount++;
                } else if (customersList[0].branch == "entc") {
                  pgEntcCustomersCount++;
                }
              }
            }
            totalCustomersCount = maleCustomersCount + femaleCustomersCount;
          }
          // }
          // console.log('male customers', maleCustomersCount, 'female customers', femaleCustomersCount, 'total customers count',totalCustomersCount)
          // console.log('ugCS', ugCsCustomersCount, 'ugIT', ugItCustomersCount, 'ugENTC',ugEntcCustomersCount)
          // console.log('pgCS', pgCsCustomersCount, 'pgIT', pgItCustomersCount, 'pgENTC',pgEntcCustomersCount)
          obj.male = maleCustomersCount
          obj.female = femaleCustomersCount
          obj.total = totalCustomersCount
          obj.ugCsCustomersCount = ugCsCustomersCount
          obj.ugItCustomersCount = ugItCustomersCount
          obj.ugEntcCustomersCount = ugEntcCustomersCount
          obj.pgCsCustomersCount = pgCsCustomersCount
          obj.pgItCustomersCount = pgItCustomersCount
          obj.pgEntcCustomersCount = pgEntcCustomersCount
          obj.totalSalaryOfferedByJob += totalCustomersCount * job.ctc;
          // console.log('finalobj', obj)
          reportArr.push(obj)
        }
        // };
        // );

      } else {
        // * For Female, Male total
        const data = await Application.find({ jobId: { $eq: job._id } }).populate("customer")
        // .exec(
        if (!data.length) {
          // console.log(`No applicants to this job`, data)
        } else {

          // async function (err, data) {
          // if (err) {
          //   console.log('err in totalAppliedForJob', err);
          // } else {
          // const maleCustomers = await data.find();
          // console.log('male customers',data[0])
          for (let i = 0; i < data.length; i++) {
            let customer = data[i];

            // console.log('customer.gender',JSON.stringify(customer.customer));
            let customersList = (customer.customer);
            // if(customersList[0].gender == "male"){
            //   maleCustomersCount++;
            // }else{
            //   femaleCustomersCount++;
            // }
            // console.log('customersList',customersList[0].gender)
            // console.log('customersList[0].LTE20.jobId == job._id for ',JSON.stringify(customersList[0].LTE20.jobId)," ", JSON.stringify(job._id))
            if (!customersList[0].GT20.status && customersList[0].LTE20.status && JSON.stringify(customersList[0].LTE20.jobId) === JSON.stringify(job._id)) {
              // console.log('customersList[0].gender == male for ',JSON.stringify(customersList[0].gender))
              if (customersList[0].gender == "male") {
                maleCustomersCount++;
              } else {
                femaleCustomersCount++;
              }

              // * now checking for course and department
              if (customersList[0].isUg) {
                // let ugCsCustomersCount = 0;
                // let ugItCustomersCount = 0;
                // let ugEntcCustomersCount = 0;
                if (customersList[0].branch == "cs") {
                  ugCsCustomersCount++;
                } else if (customersList[0].branch == "it") {
                  ugItCustomersCount++;
                } else if (customersList[0].branch == "entc") {
                  ugEntcCustomersCount++;
                }
              } else {
                // let pgCsCustomersCount = 0;
                // let pgItCustomersCount = 0;
                // let pgEntcCustomersCount = 0;
                if (customersList[0].branch == "cs") {
                  pgCsCustomersCount++;
                } else if (customersList[0].branch == "it") {
                  pgItCustomersCount++;
                } else if (customersList[0].branch == "entc") {
                  pgEntcCustomersCount++;
                }
              }
            }
            totalCustomersCount = maleCustomersCount + femaleCustomersCount;
          }
          // }
          // console.log('male customers', maleCustomersCount, 'female customers', femaleCustomersCount, 'total customers count',totalCustomersCount)
          // console.log('ugCS', ugCsCustomersCount, 'ugIT', ugItCustomersCount, 'ugENTC',ugEntcCustomersCount)
          // console.log('pgCS', pgCsCustomersCount, 'pgIT', pgItCustomersCount, 'pgENTC',pgEntcCustomersCount)
          obj.male = maleCustomersCount
          obj.female = femaleCustomersCount
          obj.total = totalCustomersCount
          obj.ugCsCustomersCount = ugCsCustomersCount
          obj.ugItCustomersCount = ugItCustomersCount
          obj.ugEntcCustomersCount = ugEntcCustomersCount
          obj.pgCsCustomersCount = pgCsCustomersCount
          obj.pgItCustomersCount = pgItCustomersCount
          obj.pgEntcCustomersCount = pgEntcCustomersCount
          obj.totalSalaryOfferedByJob += totalCustomersCount * job.ctc;
          console.table(obj)
          reportArr.push(obj)
        }
      }
      // );
      // }
      // console.log(JSON.stringify(totalAppliedForJob))
    }
    // console.log(obj)
    res.send({ success: true, data: reportArr, message: "Placement Report Generated" });
  } catch (err) {
    // console.log("Error in generating report:", err);
  }
};

module.exports.customer_application_delete = async (req, res) => {
  try {
    const applicationId = req.params.applicationId;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    await application.remove();

    res.status(200).json({
      success: true,
      message: "Application Deleted Successfully.",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
      message: "Error while Deleting Application.",
    });
  }
}