const jwt = require('jsonwebtoken');
const AdminModel = require('../models/admin'); // Assuming you have an Admin model



const checkAuth =(req,res,next)=>{
    // console.log("hello auth")
    const token = req.cookies.token
    // console.log(token)
    if (!token) {
    req.flash("error", "token not get");
    res.redirect("/login");
  }
  try {
    const decoded = jwt.verify(token, "sdihdskghaknkgjohoinakg");

    // console.log(decoded)

    req.user = decoded;  
    // console.log(req.user)

    next();

  } catch (error) {
    return res.redirect("/login");
  }
}


module.exports = checkAuth;