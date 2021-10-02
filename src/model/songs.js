const mongoose=require('mongoose')

const song= new mongoose.Schema({
    name:{type:String},
    singer:{type:String},
    img:{type:String},
    views:{type:String},
    likes:{type:Number},
    dislikes:{type:Number}
})

module.exports= mongoose.model('song',song)