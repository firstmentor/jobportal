const AdminModel = require("../../models/admin");
const UserModel = require("../../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class AdminController {
  static dashboard = async (req, res) => {
    // console.log(req.user)
    try {
      res.render("admin/dashboard", {
        title: "Dashboard",
        name: req.user.name,
      }); // this name view in dashboard when user login
    } catch (error) {
      console.log(error);
    }
  };
  
  static adminInsert = async (req, res) => {
    try {
      // console.log(req.body);
      const { name, email, password, phone } = req.body;

      // Validate fields
      if (!name || !email || !password || !phone) {
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
      const newUser = UserModel.create({
        name,
        email,
        password: hashedPassword,
        phone,
      });
      req.flash("success", "user registered successfully");
      return res.redirect("/login");


      

    } catch (error) {
      console.log(error);
      
    }
  };

  static verifyLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await AdminModel.findOne({ email });
  
      if (!user) {
        req.flash("error", "You are not a registered user");
        return res.redirect("/login");
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        req.flash("error", "Email or Password not Match");
        return res.redirect("/login");
      }
  
      // Password matched, create token
      const token = jwt.sign(
        { id: user._id, name: user.name, role: user.role },
        process.env.Secret_key
      );
      res.cookie("token", token);
  
      // Role based redirect
      if (user.role === "admin") {
        return res.redirect("/dashboard");
      } else if (user.role === "jobseeker") {
        return res.redirect("/");
      } else {
        // Agar role unknown hai to login page
        req.flash("error", "Invalid user role");
        return res.redirect("/login");
      }
    } catch (error) {
      console.log(error);
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
}

module.exports = AdminController;
