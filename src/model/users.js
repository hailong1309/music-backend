
const mongoose=require('mongoose')
const user= new mongoose.Schema({
    email:{type:String},
    password:{type:String},
    username:{type:String},
    'favorite-songs':{type:Array,default:[]},
    'recently-songs':{type:Array,default:[]},
    currentSong:{type:Object,default:{}},
    img:{type:String,default:''},
    following:{type:Array,default:[]}

})

module.exports= mongoose.model('user',user)