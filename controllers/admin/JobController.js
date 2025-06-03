const JobModel = require("../../models/job");
const cloudinary = require("cloudinary");
const CategoryModel = require("../../models/category");
const moment = require("moment");
const JobApplicationModel =require('../../models/ApplicationModel')
const fs = require("fs");


cloudinary.config({
  cloud_name: "dc1vepuqh",
  api_key: "684778925687591",
  api_secret: "ARlFtEOKrR3tyxKC6wPWpA9JXOA", // Click 'View API Keys' above to copy your API secret
});

class JobController {
  static display = async (req, res) => {
    try {
      const job = await JobModel.find().sort({ createdAt: -1 }); // data fetch mongodb
      const category = await CategoryModel.find().sort({ createdAt: -1 });

      //   console.log(job);
      res.render("admin/job/display", {
        name: req.user.name,
        j: job,
        c: category,
        success: req.flash("success"),
      });
    } catch (error) {
      console.log(error);
    }
  };
  static insertJob = async (req, res) => {
    try {
      // console.log(req.files.image);

      // console.log(imageUpload)
      const {
        category,
        title,
        description,
        companyName,
        location,
        jobtype,
        salaryRange,
        skillsRequired,
        lastDateToApply,
      } = req.body;
      //image upload
      const file = req.files.image;
      const imageUpload = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "image",
      });
      const job = await JobModel.create({
        category,
        title,
        description,
        companyName,
        location,
        jobtype,
        salaryRange,
        skillsRequired,
        lastDateToApply,
        image: {
          public_id: imageUpload.public_id,
          url: imageUpload.secure_url,
        },
      });

      req.flash("success", "Job insert Successfully");
      res.redirect("/job/display");
    } catch (error) {
      console.log(error);
    }
  };
  static viewJob = async (req, res) => {
    try {
      // console.log(req.params.id)
      const id = req.params.id;
      const job = await JobModel.findById(id); //data fetch mognobd
      //   console.log(category);
      res.render("admin/job/view", {
        name: req.user.name,
        job,
      });
    } catch (error) {
      console.log(error);
    }
  };
  static editJob = async (req, res) => {
    try {
      // console.log(req.params.id);
      const id = req.params.id;
      const job = await JobModel.findById(id);
      // console.log(job);
      res.render("admin/job/edit", {
        name: req.user.name,
        j: job,
      });
    } catch (error) {
      console.log(error);
    }
  };

  static UpdateJob = async (req, res) => {
    try {
      const id = req.params.id;

      const {
        title,
        description,
        companyName,
        location,
        jobType,
        salaryRange,
        skillsRequired,
        lastDateToApply,
        category,
      } = req.body;

      const job = await JobModel.findById(id);
      let updatedImage = job.image;

      if (req.files && req.files.image) {
        // 1. Delete old image from cloudinary
        if (job.image && job.image.public_id) {
          await cloudinary.uploader.destroy(job.image.public_id);
        }

        // 2. Upload new image to Cloudinary
        const file = req.files.image;
        const uploadResult = await cloudinary.uploader.upload(
          file.tempFilePath
        );

        // 3. Prepare image object for DB
        updatedImage = {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
        };
      }

      // 4. Update the job in DB
      await JobModel.findByIdAndUpdate(id, {
        title,
        description,
        companyName,
        location,
        jobType,
        salaryRange,
        skillsRequired,
        lastDateToApply,
        category,
        image: updatedImage,
      });

      req.flash("success", "Job updated successfully");
      res.redirect("/job/display");
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).send("Internal Server Error");
    }
  };

  static deleteJob = async (req, res) => {
    try {
      const id = req.params.id;

      // Step 1: Find the job by ID
      const job = await JobModel.findById(id);

      // Step 2: If image exists, delete from Cloudinary
      if (job.image && job.image.public_id) {
        await cloudinary.uploader.destroy(job.image.public_id);
      }

      // Step 3: Delete job from database
      await JobModel.findByIdAndDelete(id);

      req.flash("success", "Job deleted successfully");
      res.redirect("/job/display");
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };


  //apply job
   //apply job function


   static applyJob = async (req, res) => {
     try {
       const jobId = req.params.id;
   
       const alreadyApplied = await JobApplicationModel.findOne({
         userId: req.user.id,
         jobId: jobId
       });
   
       if (alreadyApplied) {
         req.flash("error", "You have already applied for this job.");
         return res.redirect("/joblist");
       }
   
       let resumeUpload = null;
       if (req.files && req.files.resume) {
         const file = req.files.resume;
   
         // ✅ Proper resume upload
         resumeUpload = await cloudinary.uploader.upload(file.tempFilePath, {
           folder: "resumes",
           resource_type: "raw"
         });
         

   
         fs.unlinkSync(file.tempFilePath); // delete temp file
   
        //  console.log("Uploaded Resume:", resumeUpload); // ✅ This should print proper object
       }
   
       const newApplication = new JobApplicationModel({
         userId: req.user.id,
         jobId: jobId,
         resume: {
           public_id: resumeUpload.public_id,
           url: resumeUpload.secure_url
         },
         coverLetter: req.body.coverLetter,
         appliedAt: new Date()
       });
   
       await newApplication.save();
   
       req.flash("success", "You have successfully applied for the job.");
       res.redirect("/jobdetails/" + jobId);
   
     } catch (err) {
       console.log("Upload Error:", err);
       req.flash("error", "Something went wrong while applying.");
       res.redirect("/joblist");
     }
   };
   
  

  static myApplications = async (req, res) => {
    try {
      // Logged-in user ka id lein
      const userId = req.user.id;
  
      // User ke sab applications lein, job details ke saath populate karke
      const applications = await JobApplicationModel.find({ userId: userId })
        .populate('jobId')  // job ke details populate karne ke liye
        .sort({ appliedAt: -1 });  // latest pehle dikhaye
  
      // Applications ko EJS template ko bhejein
      res.render("admin/job/myApplications", { applications, user: req.user });
  
    } catch (error) {
      console.error(error);
     
    }
  };

  static viewAllApplications = async (req, res) => {
    try {
      // Sare job applications fetch karenge, job aur user details ke saath
      const applications = await JobApplicationModel.find()
        .populate('jobId', 'title companyName')  // sirf job ka title aur companyName lenge
        .populate('userId', 'name email');       // user ka naam aur email bhi lenge
  
      res.render('admin/job/applications', { applications });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  };
  

  


}
module.exports = JobController;
