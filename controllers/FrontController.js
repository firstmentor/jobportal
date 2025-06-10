const CategoryModel = require("../models/category");
const JobModel = require("../models/job");
// const ContactModel = require('../models/contact')
const JobApplicationModel =require('../models/ApplicationModel')

class FrontController {
  static home = async (req, res) => {
    try {
      const categories = await CategoryModel.find().sort({ createdAt: -1 });;
      const jobs = await JobModel.find().sort({ createdAt: -1 });;
      // console.log(categories)
      // console.log(jobs)
      res.render("home", { c: categories, j: jobs });
    } catch (error) {
      console.log(error);
    }
  };
  static about = async (req, res) => {
    try {
      res.render("about");
    } catch (error) {
      console.log(error);
    }
  };
  static course = async (req, res) => {
    try {
      res.send("course page");
    } catch (error) {
      console.log(error);
    }
  };
  static contact = async (req, res) => {
    try {
      res.render("contact");
    } catch (error) {
      console.log(error);
    }
  };
  static login = async (req, res) => {
    try {
      res.render("login", {
        msg: req.flash("error"),
        success: req.flash("success"),
      });
    } catch (error) {
      console.log(error);
    }
  };
  static register = async (req, res) => {
    try {
      res.render("register",{error:req.flash('error'),success:req.flash('error')});
    } catch (error) {
      console.log(error);
    }
  };
  static joblist = async (req, res) => {
    try {
      const jobs = await JobModel.find();
      res.render("joblist", { jobs });
    } catch (error) {
      console.log(error);
    }
  };

 // Controller (e.g., JobController.jobDetails)
static jobDetails = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await JobModel.findById(jobId).populate('createdBy');
    
    let alreadyApplied = false;

    if (req.user) {
      const existingApplication = await JobApplicationModel.findOne({
        jobId: jobId,
        userId: req.user.id
      });

      alreadyApplied = !!existingApplication;
    }

    res.render("jobdetails", {
      jobs: job,
      name: req.user?.name,
      alreadyApplied,
      success:req.flash('success'),
      error:req.flash('error')
    });
  } catch (error) {
    console.log(error);
    res.redirect("/joblist");
  }
};



 
  



 
}
module.exports = FrontController;
