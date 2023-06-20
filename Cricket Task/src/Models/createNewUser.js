const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  phone: { type: Number, required: true },
  join_as: { type: String, required: true },
  academy_name: { type: String, required: true },
  password : {type:String, required: true},
  confirm_password: {type:String , required:true}
},{ timestamps: true });

module.exports = mongoose.model("newuser",userSchema)