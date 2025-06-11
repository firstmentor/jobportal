
const express = require('express');
const FrontController = require('../controllers/FrontController');
const AdminController = require('../controllers/admin/AdminController');
const CategoryController = require('../controllers/admin/CategoryController');
const JobController = require('../controllers/admin/JobController');
const route = express.Router()
const checkAuth = require('../middleware/auth');
const ContactController = require('../controllers/admin/ContactController');

//FrontController
route.get('/', FrontController.home)
route.get('/about', FrontController.about)
route.get('/course', FrontController.course)
route.get('/contact', FrontController.contact)
route.get('/login', FrontController.login)
route.get('/register', FrontController.register)
route.get('/joblist', FrontController.joblist)
route.get('/jobdetails/:id', FrontController.jobDetails)
//user insert
// route.post('/Useregister', FrontController.Useregister)








//AdminController
route.get('/dashboard',checkAuth, AdminController.dashboard)
route.post('/adminInsert', AdminController.adminInsert)
route.post('/verifyLogin', AdminController.verifyLogin)
route.get('/logout', checkAuth, AdminController.logout)
route.get('/admin/recruiters', checkAuth, AdminController.adminrecruiters)
route.get("/admin/approve/:id",checkAuth, AdminController.approveRecruiter);
route.get("/admin/reject/:id", checkAuth,AdminController.rejectRecruiter);
route.get('/admin/export-users',checkAuth, AdminController.exportUsers);
route.get('/admin/users',checkAuth, AdminController.manageUsers);
route.get('/admin/delete-user/:id', AdminController.deleteUser);
//change password
route.get('/changePassword',checkAuth, AdminController.changePassword);
route.post('/change-password', checkAuth, AdminController.postChangePassword)









//categoryController
route.get('/category/display',checkAuth, CategoryController.display)
route.post('/insertCategory',checkAuth, CategoryController.insertCategory)
route.get('/deleteCategory/:id',checkAuth, CategoryController.deleteCategory)
route.get('/viewCategory/:id', checkAuth, CategoryController.viewCategory)
route.get('/editCategory/:id', checkAuth, CategoryController.editCategory)
route.post('/UpdateCategory/:id', checkAuth, CategoryController.UpdateCategory)

//https://localhost:3000/category/display

//Jobcontroller
route.get('/recruiter/jobs',checkAuth, JobController.display)
route.post('/insertJob',checkAuth, JobController.insertJob)
route.get('/viewJob/:id', checkAuth, JobController.viewJob)
route.get('/editJob/:id', checkAuth, JobController.editJob)
route.post('/UpdateJob/:id', checkAuth, JobController.UpdateJob)
route.get('/deleteJob/:id', checkAuth, JobController.deleteJob)

//job apply 
route.post("/job/apply/:id", checkAuth, JobController.applyJob);
route.get("/myapplications", checkAuth, JobController.myApplications);
route.get("/recruiter/applicants", checkAuth, JobController.viewAllApplications);
route.post("/admin/application/:id/status", checkAuth, JobController.updateApplicationStatus);







//ContactController
route.post('/contactInsert', checkAuth, ContactController.contactInsert)




module.exports = route;