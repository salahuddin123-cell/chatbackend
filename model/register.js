const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
    
      min: 3,
      max: 20,
     
    },
    Email: {
      type: String,
      required: true,
      max: 50,
      unique:true
     
    },
    time:{
      type:Date,
    },
  
    Password: {
      type: String,
     
      min: 6,
    },
    Occupation: {
      type: String,
    
      min: 6,
    }, 
    image:{
      type:String
    },
    Lastseen:{
      type:Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Register", UserSchema);
