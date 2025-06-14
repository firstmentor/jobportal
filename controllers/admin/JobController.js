const JobModel = require("../../models/job");
const cloudinary = require("cloudinary");
const CategoryModel = require("../../models/category");
const moment = require("moment");
const JobApplicationModel = require("../../models/ApplicationModel");
const fs = require("fs");
const nodemailer = require("nodemailer");
const UserModel = require("../../models/user"); // Assuming you have a user model to fetch jobseeker
require("dotenv").config();
const sendEmail = require("../../utils/sendMail");


cloudinary.config({
  cloud_name: "dc1vepuqh",
  api_key: "684778925687591",
  api_secret: "ARlFtEOKrR3tyxKC6wPWpA9JXOA", // Click 'View API Keys' above to copy your API secret
});

class JobController {
  static display = async (req, res) => {
    try {
      const job = await JobModel.find({ createdBy: req.user.id })
        .populate("createdBy")
        .sort({ createdAt: -1 });
      const category = await CategoryModel.find().sort({ createdAt: -1 });
      // console.log(job)

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
      const {
        category,
        title,
        description,
        location,
        jobtype,
        salaryRange,
        skillsRequired,
        lastDateToApply,
      } = req.body;

      const file = req.files.image;
      const imageUpload = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "image",
      });

      const job = await JobModel.create({
        category,
        title,
        description,
        company: req.user.companyName,
        location,
        jobType: jobtype, // spelling fix
        salaryRange,
        skillsRequired,
        lastDateToApply,
        image: {
          public_id: imageUpload.public_id,
          url: imageUpload.secure_url,
        },
        createdBy: req.user.id, // ✅ recruiter _id save
      });

      // ✅ Fetch all jobseekers (assuming role === "jobseeker")
      const jobseekers = await UserModel.find({ role: "jobseeker" });

      // ✅ Send emails
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_ID,
          pass: process.env.MAIL_PASS, //Use app password, not your main Gmail password
        },
      });

      // ✅ Loop and send emails
      for (let user of jobseekers) {
        await transporter.sendMail({
          from: '"Worklnn" <your_email@gmail.com>',
          to: user.email,
          subject: `New Job Posted: ${title}`,
          html: `
             <h3>${title}</h3>
             <p>${description}</p>
             <p><strong>Location:</strong> ${location}</p>
             <p><strong>Salary:</strong> ${salaryRange}</p>
             <a href="https://jobportal-fg3t.onrender.com/joblist">View Job</a>
           `,
        });
      }

      req.flash("success", "Job inserted successfully");
      res.redirect("/recruiter/jobs");
    } catch (error) {
      console.log(error);
    }
  };

  static viewJob = async (req, res) => {
    try {
      // console.log(req.params.id)
      const id = req.params.id;
      const job = await JobModel.findById(id).populate("createdBy"); //data fetch mognobd

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
      const job = await JobModel.findById(id).populate("createdBy");
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

        location,
        jobType,
        salaryRange,
        skillsRequired,
        lastDateToApply,
        category,
        image: updatedImage,
      });

      req.flash("success", "Job updated successfully");
      res.redirect("/recruiter/jobs");
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
      res.redirect("/recruiter/jobs");
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
        jobId: jobId,
      });
  
      if (alreadyApplied) {
        req.flash("error", "You have already applied for this job.");
        return res.redirect("/joblist");
      }
  
      let resumeUpload = null;
      if (req.files && req.files.resume) {
        const file = req.files.resume;
  
        resumeUpload = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: "resumes",
          resource_type: "raw",
        });
  
        fs.unlinkSync(file.tempFilePath);
      }
  
      const newApplication = new JobApplicationModel({
        userId: req.user.id,
        jobId: jobId,
        resume: {
          public_id: resumeUpload.public_id,
          url: resumeUpload.secure_url,
        },
        coverLetter: req.body.coverLetter,
        appliedAt: new Date(),
      });
  
      await newApplication.save();
  
      // ✅ Send Email to Job Seeker
      const job = await JobModel.findById(jobId);
      const user = await UserModel.findById(req.user.id);
  
      const emailContent = `
        <h2>Hello ${user.name},</h2>
        <p>Thank you for applying to the position of <strong>${job.title}</strong> at ${job.location}.</p>
        <p>We have received your application and will get back to you soon.</p>
        <br>
        <p><strong>Job Summary:</strong></p>
        <ul>
          <li><strong>Title:</strong> ${job.title}</li>
          <li><strong>Category:</strong> ${job.category}</li>
          <li><strong>Location:</strong> ${job.location}</li>
          <li><strong>Deadline:</strong> ${new Date(job.deadline).toLocaleDateString()}</li>
        </ul>
        <br>
        <p>Best regards,<br>WorkInn Team</p>
      `;
  
      await sendEmail(user.email, "Job Application Confirmation", emailContent);
  
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
      const applications = await JobApplicationModel.find({
        userId: req.user.id,
      })
        .populate({
          path: "jobId",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .sort({ appliedAt: -1 });
      // console.log(applications)

      res.render("admin/job/myApplications", {
        applications,
        user: req.user,
      });
    } catch (error) {
      console.error(error);
    }
  };

  static viewAllApplications = async (req, res) => {
    try {
      // Sare job applications fetch karenge, job aur user details ke saath
      const applications = await JobApplicationModel.find()
        .populate("jobId") // sirf job ka title aur companyName lenge
        .populate("userId", "name email"); // user ka naam aur email bhi lenge
        console.log(applications)

      res.render("admin/job/applications", {
        applications,
        success: req.flash("success"),
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  };

  // Example: PUT /admin/application/:id/status
  static updateApplicationStatus = async (req, res) => {
    try {
      const appId = req.params.id;
      const newStatus = req.body.status;

      if (
        !["Pending", "Reviewed", "Interview", "Rejected"].includes(newStatus)
      ) {
        return res.status(400).send("Invalid status");
      }

      const application = await JobApplicationModel.findByIdAndUpdate(
        appId,
        { status: newStatus },
        { new: true }
      ).populate("userId");

      if (!application) {
        return res.status(404).send("Application not found");
      }

      // Send email notification to jobseeker
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_ID,
          pass: process.env.MAIL_PASS,
        },
      });
      // console.log('EMAIL_USER:', process.env.MAIL_ID);
      // console.log('EMAIL_PASS:', process.env.MAIL_PASS ? 'Exists' : 'Missing');

      const mailOptions = {
        from: '"PNINFOSYS Worklnn" <your_email@gmail.com>',
        to: application.userId.email,
        subject: "Application Status Updated",
        html: `
          <h3>Hello ${application.userId.name},</h3>
          <p>Your application status has been updated to: <b>${newStatus}</b>.</p>
          <br><p>Regards, <br>PNINFOSYS</p>
        `,
      };

      // Email sending is non-blocking, error shouldn't affect response
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Email send error:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });

      req.flash("success", "Application status updated and email sent.");
      return res.redirect("/recruiter/applicants"); // ✅ Only response sent
    } catch (err) {
      console.error(err);
      return res.status(500).send("Server error"); // ✅ Only one response path
    }
  };
}
module.exports = JobController;
