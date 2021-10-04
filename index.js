const express = require('express')
const app = express()
const db = require('./src/config/db')
const jwt = require('jsonwebtoken')
let Users = require('./src/model/users')
var mongo = require('mongodb');
const Song = require('./src/model/songs')
PORT=3000

app.use(express.urlencoded())
app.use(express.json())

//cors
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, Authorization, X-Requested-With, X-XSRF-TOKEN, Content-Type, Accept'
    );
    res.header(
        'Access-Control-Allow-Methods',
        'GET,PUT,POST,DELETE,PATCH,OPTIONS'
    );
    next();
});
// connect mongo db
db.connectDB()

// get all users
app.get('/users', (req, res) =>
    Users.find({}, (err, result) => {
        if (!err) {

        } else {
            res.status(400).json({ message: 'ko co gi' })
        }
    })
)

//get 6 songs for home page
app.get('/songs', (req, res) => {

    Song.find({}, (err, result) => {
        if (!err) {
            const songs = result.splice(0, 6);
            res.status(200).json(songs)
        } else {
            res.status(400).json({ message: 'ko co gi' })
        }
    })
})
//get all songs
app.get('/allsongs', (req, res) => {
    Song.find({}, (err, result) => {
        if (!err) {
            res.status(200).json(result)
        } else {
            res.status(400).json({ message: 'ko co gi' })
        }
    })
})

// add song to my favorite songs
app.put('/addSong', (req, res) => {
    var token = req.body.params.token
    var result = jwt.verify(token, '123')
    var id = result._id
    var o_id = mongo.ObjectId(req.body.params.songID)
    Users.find({ 'favorite-songs': o_id }).then(data => {

        if (data != '') {

            var action = { $pull: { "favorite-songs": o_id } }
            Users.updateOne({ _id: result._id }, action, (err, result) => {
                if (err) {
                    res.status(401).json({ message: 'Updated failed' })
                    console.log('Update Failed')
                } else {
                    res.status(200).json({ mesage: 'Updated' })
                    console.log(result.modifiedCount + " document(s) updated");
                }
            })
        } else {
            var action = { $push: { "favorite-songs": o_id } }
            Users.updateOne({ _id: result._id }, action, (err, result) => {
                if (err) {
                    res.status(401).json({ message: 'Updated failed' })
                    console.log('Update Failed')
                } else {
                    res.status(200).json({ mesage: 'Updated' })
                    console.log(result.modifiedCount + " document(s) updated");

                }
            })
        }
    })

})

//login

app.post('/login', (req, res, next) => {
    var email = req.body.email
    var password = req.body.password
    //find user with email and password
    Users.findOne({ email: email, password: password }).then(data => {
        if (data) {
            //sign user id in token
            var token = jwt.sign({ _id: data._id }, '123')
            res.status(200).json({ message: 'Dang nhap', token: token })
        } else {
            res.status(400).json('Wrong usernamne or password')
        }
    }).catch(err => {
        console.log(err)
        res.json('loi server')
    })

})
// get top songs with views count
app.get('/chart',(req,res,next)=>{
    Song.find().sort({views:-1}).limit(10).then(data =>{
        res.json(data)
    })

})

// get user favorite songs
app.get('/mymusic', function (req, res, next) {
    // get token
    var token = req.query.token
    var result = jwt.verify(token, '123')
    //get user
    Users.findById(result._id).then(async data => {
        if (data) {
            // get list of favorite song id   in user 
            const songs = data['favorite-songs'];
            try {
                //get list of songs corresponding list of songs id
                const records = await Song.find().where('_id').in(songs).exec();
                if (records) {
                    res.json(records)
                } else {
                    res.json({ message: 'No favorite songs' })
                }
            } catch (error) {
                console.log(error)
            }
        } else {
            console.log('Can not find user')
        }
    })
})

// app.get('/',(req,res)=>{
//     res.json({message:'ok chua'})
// })

app.listen('3000', () => console.log('dang chay r hahha'))