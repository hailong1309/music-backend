
const mongoose=require('mongoose')


const user= new mongoose.Schema({
    email:{type:String},
    password:{type:String},
    username:{type:String},
    'favorite-songs':{type:Array}
})

module.exports= mongoose.model('user',user)