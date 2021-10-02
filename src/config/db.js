const mongoose=require('mongoose')

async function connectDB(){
    
    try {
        await mongoose.connect('mongodb+srv://admin:admin@cluster0.togx2.mongodb.net/music-apps?retryWrites=true&w=majority',{
            useNewUrlParser:true,
            useUnifiedTopology:true
        })
        console.log(' Database Connected')
        
    } catch (error) {
        console.log(' Database Connect Failed')
    }
}
module.exports={connectDB}