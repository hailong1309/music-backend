
const mongo=require('mongoose')


const user= new mongo.Schema({
    email:{type:String},
    password:{type:String},
    username:{type:String},
    'favorite-songs':{type:Array}
})

module.exports= mongo.model('user',user)