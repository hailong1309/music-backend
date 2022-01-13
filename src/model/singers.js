const mongoose=require('mongoose')

const singer=new mongoose.Schema({
    name:{type:String},
    description:{type:String},
    follow:{type:Number},
    img:{type:String}
})

module.exports=mongoose.model('singer',singer)