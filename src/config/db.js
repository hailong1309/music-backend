const mongoose=require('mongoose')
const dbUrl='mongodb+srv://admin:admin@cluster0.togx2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
async function connectDB(){
    
    try {
        await mongoose.connect(dbUrl,{
            useNewUrlParser:true,
            useUnifiedTopology:true
        })
        console.log(' Database Connected')
        
    } catch (error) {
        console.log(' Database Connect Failed')
    }
}
module.exports={connectDB}