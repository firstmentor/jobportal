const AdminModel = require("../../models/admin");
const UserModel = require("../../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendMail = require("../../utils/sendMail");
const JobModel = require('../../models/job')
const JobApplication =require('../../models/ApplicationModel')
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');



class AdminController {

  static dashboard = async (req, res) => {
    try {
      const totalUsers = await UserModel.countDocuments({ role: { $in: ['jobseeker', 'recruiter'] } });
      const totalRecruiters = await UserModel.countDocuments({ role: 'recruiter', status: 'approved' });
      const pendingRecruiters = await UserModel.countDocuments({ role: 'recruiter', status: 'pending' });
      const totalJobs = await JobModel.countDocuments();
      const totalApplications = await JobApplication.countDocuments();
  
      const pendingList = await UserModel.find({ role: 'recruiter', status: 'pending' });
  
      // 🔥 Get Job count by category (for Bar Chart)
      const jobsByCategory = await JobModel.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]);
  
      // Prepare data for Chart.js
      const jobCategoryLabels = jobsByCategory.map(j => j._id);
      const jobCategoryCounts = jobsByCategory.map(j => j.count);
  
      res.render('admin/dashboard', {
        totalUsers,
        totalRecruiters,
        pendingRecruiters,
        totalJobs,
        totalApplications,
        pendingList,
        jobCategoryLabels,
        jobCategoryCounts,
        success: req.flash('success'),
        error: req.flash('error')
      });
  
    } catch (error) {
      console.log("Dashboard Error:", error);
    }
  }
  
  
  static adminInsert = async (req, res) => {
    try {
      const { name, email, password, phone, role,companyName } = req.body;
  
      // Validate fields
      if (!name || !email || !password || !phone || !role) {
        req.flash("error", "All fields are required");
        return res.redirect("/register");
      }
  
      // Check if email already exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        req.flash("error", "Email already registered");
        return res.redirect("/register");
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create and save user
      const newUser = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        companyName: role === 'recruiter' ? companyName : null,
        status: role === "recruiter" ? "pending" : "approved"  // 👈 recruiter = pending
      });
  
      req.flash("success", "User registered successfully. Recruiters need admin approval.");
      return res.redirect("/login");
  
    } catch (error) {
      console.log(error);
      req.flash("error", "Something went wrong");
      return res.redirect("/register");
    }
  };
  

  static verifyLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await UserModel.findOne({ email }); // 👈 UserModel not AdminModel
  
      if (!user) {
        req.flash("error", "You are not a registered user");
        return res.redirect("/login");
      }
  
      // If recruiter is not approved
      if (user.role === "recruiter" && user.status !== "approved") {
        req.flash("error", "Recruiter account pending approval by admin.");
        return res.redirect("/login");
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        req.flash("error", "Email or Password do not match");
        return res.redirect("/login");
      }
  
      // Create token after successful login
      const token = jwt.sign(
        { id: user._id, name: user.name, role: user.role },
        process.env.Secret_key
      );
      res.cookie("token", token);
  
      // Role-based redirect
      if (user.role === "admin") {
        return res.redirect("/dashboard");
      } else if (user.role === "jobseeker") {
        return res.redirect("/");
      } else if (user.role === "recruiter") {
        return res.redirect("/dashboard");
      } else {
        req.flash("error", "Invalid user role");
        return res.redirect("/login");
      }
    } catch (error) {
      console.log(error);
      req.flash("error", "Something went wrong");
      return res.redirect("/login");
    }
  };
  
  
  static logout = async (req, res) => {
    try {
      res.clearCookie("token");
      req.flash("success", "logout successfully");
      return res.redirect("/login");
    } catch (error) {
      console.log(error);
    }
  };

  static adminrecruiters = async (req, res) => {
    try {
      // Sirf "recruiter" role wale users jinka status "pending" hai
      const pendingRecruiters = await UserModel.find({ role: "recruiter", status: "pending" });
  
      res.render("admin/ApproveRecruiters", {
        success: req.flash("success"),
        error: req.flash("error"),
        recruiters: pendingRecruiters
      });
  
    } catch (error) {
      console.log("Error in adminrecruiters:", error);
      req.flash("error", "Something went wrong!");
      return res.redirect("/dashboard");
    }
  };

  
  static approveRecruiter = async (req, res) => {
    try {
      const recruiterId = req.params.id;
      const recruiter = await UserModel.findById(recruiterId);
  
      await UserModel.findByIdAndUpdate(recruiterId, {
        status: "approved"
      });
  
      // Send approval email
      const html = `<h3>Hello ${recruiter.name},</h3>
        <p>Your account as a recruiter has been <b>approved</b>.</p>
        <p>You can now login and start posting jobs.</p>`;
      await sendMail(recruiter.email, "Recruiter Approval", html);
  
      req.flash("success", "Recruiter approved and notified.");
      res.redirect("/admin/recruiters");
    } catch (error) {
      console.log("Error in approveRecruiter:", error);
      req.flash("error", "Error approving recruiter.");
      res.redirect("/admin/recruiters");
    }
  };
  
  static rejectRecruiter = async (req, res) => {
    try {
      const recruiterId = req.params.id;
      const recruiter = await UserModel.findById(recruiterId);
  
      await UserModel.findByIdAndDelete(recruiterId);
  
      // Send rejection email
      const html = `<h3>Hello ${recruiter.name},</h3>
        <p>We regret to inform you that your recruiter account has been <b>rejected</b>.</p>
        <p>You may contact support for more details.</p>`;
      await sendMail(recruiter.email, "Recruiter Rejected", html);
  
      req.flash("success", "Recruiter rejected and notified.");
      res.redirect("/admin/recruiters");
    } catch (error) {
      console.log("Error in rejectRecruiter:", error);
      req.flash("error", "Error rejecting recruiter.");
      res.redirect("/admin/recruiters");
    }
  };

  static exportUsers = async (req, res) => {
    try {
      const users = await UserModel.find({ role: { $in: ['jobseeker', 'recruiter'] } }).lean();
  
      const fields = ['name', 'email', 'phone', 'role', 'status'];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(users);
  
      const filename = 'users-export.csv';
      const filePath = path.join(__dirname, '../../public/downloads', filename);
  
      // Ensure directory exists
      fs.mkdirSync(path.join(__dirname, '../../public/downloads'), { recursive: true });
  
      // Write to file
      fs.writeFileSync(filePath, csv);
  
      res.download(filePath, filename); // auto prompt download
    } catch (err) {
      console.error("CSV Export Error:", err);
      res.status(500).send('Internal Server Error');
    }
  }

  static manageUsers = async (req, res) => {
    try {
      const users = await UserModel.find({ role: { $in: ['jobseeker', 'recruiter'] } }).lean();
      res.render('admin/manageUsers', {
        users,
        success: req.flash('success'),
        error: req.flash('error'),
      });
    } catch (err) {
      console.log("Manage Users Error:", err);
      res.status(500).send('Server Error');
    }
  };

  static deleteUser = async (req, res) => {
    try {
      const id = req.params.id;
      await UserModel.findByIdAndDelete(id);
      req.flash("success", "User deleted successfully.");
      res.redirect("/admin/users");
    } catch (err) {
      console.log("Delete User Error:", err);
      req.flash("error", "Something went wrong!");
      res.redirect("/admin/users");
    }
  };
  





}

module.exports = AdminController;
