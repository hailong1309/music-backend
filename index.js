const express = require('express')
const db = require('./src/config/db')
const jwt = require('jsonwebtoken')
const Users = require('./src/model/users')
const mongo = require('mongodb');
const Song = require('./src/model/songs')
const History = require('./src/model/history')
const cookieParser = require('cookie-parser')
const author = require('./src/midleware/authorize')
const app = express()


app.use(express.urlencoded())
app.use(express.json())
app.use(cookieParser())
//cors
app.use(function (req, res, next) {
    // res.header('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,Authorization");
    next();
});
// connect mongo db
db.connectDB()

// get  user by id
app.get('/users', (req, res) => {
    var token = req.query.token
    var result = jwt.verify(token, '123')
    Users.findById(result._id).then(user => {
        if (user) {
            res.json.status(200).json(user)
        } else {
            res.json.status(402).json({ message: 'User not found' })
        }
    })
}

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

            res.status(200).send(result)
        } else {
            res.status(400).json({ message: 'No song' })
        }
    })
})

// add song to my favorite songs
app.post('/addSong', author.checkLogin, (req, res) => {
    const token = req.header('authorization')
    const result = jwt.verify(token, '123')
    const uid = result._id
    const o_id = mongo.ObjectId(req.body.songID)
    Users.find({ _id: uid, 'favorite-songs': o_id }).then(data => {

        //remove song if exsist in favorite song
        if (data != '') {
            console.log('----pull-------')
            var action = { $pull: { "favorite-songs": o_id } }
            Users.updateOne({ _id: result._id }, action).then(result => {
                if (result.modifiedCount > 0) {
                    res.status(200).json({ mesage: 'Updated' })
                    console.log(result.modifiedCount + " document(s) updated");
                } else {
                    res.status(401).json({ message: 'Updated failed' })
                    console.log('Update Failed')
                }
            })
            //add if not exsist
        } else {
            console.log('----push-------')
            var action = { $push: { "favorite-songs": o_id } }
            Users.updateOne({ _id: result._id }, action).then(result => {
                if (result.modifiedCount > 0) {
                    res.status(200).json({ mesage: 'Updated' })
                    console.log(result.modifiedCount + " document(s) updated");
                } else {
                    res.status(401).json({ message: 'Updated failed' })
                    console.log('Update Failed')
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
            res.send({ token: token, message: 'Ok' })
        } else {
            res.status(400).json('Wrong usernamne or password')
        }
    }).catch(err => {
        console.log(err)
        res.json('loi server')
    })

})

// get top songs with views count
app.get('/chart', (req, res, next) => {
    Song.find().sort({ views: -1 }).limit(10).then(data => {
        res.json(data)
    })
})

// get user favorite songs
app.get('/mymusic', author.checkLogin, (req, res, next) => {
    // get token
    var token = req.header('authorization')
    var result = jwt.verify(token, '123')
    //get user
    Users.findById(result._id).then(async data => {
        if (data) {
            // get list of favorite song id in user 
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

//get playlist of user
// app.get('myplaylist', (req, res, next) => {
//     // get token
//     var token = req.header('authorization')
//     var result = jwt.verify(token, '123')

//     Playlist.find({ userID: result._id }).then((data) => {
//         if (data) {
//             res.json(data)
//         } else {
//             res.json({ message: 'No playlist' })
//         }
//     })
// })

// get historysong of user
app.get('/history', author.checkLogin, (req, res) => {
    let token = req.header('authorization')
    let result = jwt.verify(token, '123')
    let id = mongo.ObjectId(result._id)

    History.findOne({ userID: id }).then(async data => {
        if (!data) {
            let history = new History({ userID: id, song: [] })
            History.insertMany(history, (err, result) => {
                if (err) throw err;
                console.log(result.insertedCount)
            })
        } else {
            const songs = data.songs
            res.json(songs)

        }
    })
})

app.post('/history', author.checkLogin, (req, res) => {
    console.log('zo day')
    let token = req.header('authorization')
    let songID = req.body.songID
    let result = jwt.verify(token, '123')
    let uid = mongo.ObjectId(result._id)

    History.findOne({ userID: uid }).then(async data => {
        const songArray = data['songs']
        let length = songArray.length
        //remove if song ID exsist in history]
        await History.find({ userID: uid, 'songs': songID }).then(async result => {
            if (result.length == 0) {

                // push song to first element in song array
                var action = { $push: { "songs": { $each: [songID], $position: 0 } } }

                await History.updateOne({ userID: uid }, action).then(async data => {
                    console.log(data)
                    if (data.modifiedCount > 0) {
                        length += 1
                    }
                    //remove when array greater than 10 ele
                    if (length > 10) {
                        await History.updateOne({ userID: uid }, { $pop: { songs: 1 } }).then()
                    }

                })
            }
        })
        await History.findOne({ userID: uid }).then(result => {
            res.json(result['songs'])

        })
    })
})

app.listen(process.env.PORT || 3000, () => console.log('dang chay r hahha'))