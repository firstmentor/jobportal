const mongoose = require('mongoose')
const contactSchema = new mongoose.Schema({


name:{
    type: String,
    required: true
},
email:{
    type: String,
    required: true
}, 
Subject: {
    type: String,
    required: true
},

message: {
    type: String,
    required: true
}, 

})


const ContactModel = mongoose.model('contact', contactSchema)
module.exports = ContactModel