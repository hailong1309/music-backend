const mongoose=require('mongoose')

async function connectDB(){
    
    try {
        await mongoose.connect('mongodb://localhost:27017/music-app',{
            useNewUrlParser:true,
            useUnifiedTopology:true
        })
        console.log(' Database Connected')
        
    } catch (error) {
        console.log(' Database Connect Failed')
    }
}
module.exports={connectDB}