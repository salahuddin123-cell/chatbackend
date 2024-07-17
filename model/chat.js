
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let chatSchema = new Schema({
user: {
		type: String,
		unique: true,
	},
id: {
	type: String
},
me: {
	type: String
},
time:{
	type:Date,
  },
message: {
	type: String
},
image:{
type:String
},
}, {
	collection: 'chat2'
})

module.exports = mongoose.model('Newchat', chatSchema)