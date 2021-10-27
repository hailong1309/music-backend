const jwt=require('jsonwebtoken')

module.exports.checkLogin=(req,res,next)=>{
    const token=req.header('authorization')
    // console.log('------token------')
    // console.log(token)
    if(token){
         jwt.verify(token,'123',(err,result)=>{
            if (err){
                res.status(401).send('Token not valid')
            }else{            
                next()
            }
        })
     
    }else{
        res.status(401).send('Not logged')
    }

}


