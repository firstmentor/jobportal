const mongoose = require('mongoose')





const connectDb =async()=>{
    try{
      await mongoose.connect(process.env.live_url)
      console.log("connect db")
    }catch(error){
        console.log(error)
    }
}

module.exports =connectDb