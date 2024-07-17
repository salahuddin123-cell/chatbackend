const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let groupSchema = new Schema({
Name:{
   type:String,
   unique:true,
},
users: {
		type: Array,
	
	},
ids: {
	type: Array
},

time:{
	type:Date,
  },

}, {
	collection: 'group'
})

module.exports = mongoose.model('group',groupSchema )