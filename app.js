const mongoose = require ('mongoose')
const express = require('express')
const app = express()
const port = 3000
const web  = require('./routes/web')
const connectDb = require('./database/connectDb')
const flash = require('connect-flash');
const session = require('express-session')
const cookieParser = require('cookie-parser')
require('dotenv').config();
const setUserInfo = require('./middleware/setUserInfo')

//image uplaod
const fileUpload = require('express-fileupload')
app.use(fileUpload({
    useTempFiles : true,
    
}));



//token get cookie
app.use(cookieParser())
 


// messages
app.use(session({
    secret: 'secret',
    cookie: {maxAge: 60000},
    resave: false,
    saveUninitialized: false,
}));
// Flash messages
app.use(flash())
app.use(setUserInfo)



//view engine ejs
app.set('view engine', 'ejs')

//static file
app.use(express.static('public'))

//connect DB
connectDb()

//data get form
app.use(express.urlencoded())










//route load
app.use('/',web)

//server star
app.listen(process.env.PORT, () => {
  console.log(`server start localhost:${process.env.PORT}`)
})