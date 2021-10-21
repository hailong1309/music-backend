
const mongoose=require('mongoose')
const mongo=require('mongodb')

const playlist=new mongoose.Schema({
    id:{type:mongo.ObjectId},
    userID:{type:mongo.ObjectId},
    song:{type:Array},
    name:{type:String}
})
module.exports= mongoose.model('playlist',playlist)