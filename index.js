const express = require('express')
const app = express()
const db = require('./src/config/db')
const jwt = require('jsonwebtoken')
let Users = require('./src/model/users')
var mongo = require('mongodb');
const Song = require('./src/model/songs')
const Playlist = require('./src/model/playlist')
const History = require('./src/model/history')



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
            res.status(200).json(result)
        } else {
            res.status(400).json({ message: 'No song' })
        }
    })
})

// add song to my favorite songs
app.put('/addSong', (req, res) => {
    var token = req.body.params.token
    var result = jwt.verify(token, '123')
    var o_id = mongo.ObjectId(req.body.params.songID)
    Users.find({ 'favorite-songs': o_id }).then(data => {

        //remove song if exsist in favorit song
        if (data != '') {
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
app.get('/chart', (req, res, next) => {
    Song.find().sort({ views: -1 }).limit(10).then(data => {
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
app.get('myplaylist', (req, res, next) => {
    // get token
    var token = req.query.token
    var result = jwt.verify(token, '123')

    Playlist.find({ userID: result._id }).then((data) => {
        if (data) {
            res.json(data)
        } else {
            res.json({ message: 'No playlist' })
        }
    })
})


// get historysong of user

app.get('/history', (req, res) => {
    let token = req.query.token
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
            const songs = data.songs  //[3,1,2]           
            res.json(songs)

        }
    })
})

app.post('/history', (req, res) => {
    let token = req.body.params.token
    let songID = req.body.params.songID
    let result = jwt.verify(token, '123')
    let uid = mongo.ObjectId(result._id)

    History.findOne({ userID: uid }).then(async data => {
        const songArray = data['songs']
        let length = songArray.length
        //remove if song ID exsist in history]
        await History.find({ 'songs': songID }).then(async result => {
            if (result.length == 0) {
                // push song to first element in song array
                var action = { $push: { "songs": { $each: [songID], $position: 0 } } }
                
                await History.updateOne({ userID: uid }, action).then(async data => {
                    if(data.modifiedCount>0){
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
            console.log(result['songs'])
        })
        // History.updateOne({}, { $pull: { 'songs': { $in: [songID] } } }).then(result => {

        //     if (result.modifiedCount == 1) {
        //         length -= 1
        //     }
        //     var action = { $push: { "songs": { $each: [songID], $position: 0 } } }
        //     //push song to first element in song array
        //     History.updateOne({ userID: uid }, action).then(async data => {
        //         length += 1
        //         //remove when array greater than 10 ele
        //         if (length > 4) {
        //            await History.updateOne({ userID: uid }, { $pop: { songs: 1 } }).then()
        //         }
        //        await History.findOne({ userID: uid }).then(result => {
        //             res.json(result['songs'])
        //         })
        //     })

        // })
    })

})

app.listen(process.env.PORT||3000, () => console.log('dang chay r hahha'))