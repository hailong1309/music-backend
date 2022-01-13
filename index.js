const express = require("express");
const db = require("./src/config/db");
const jwt = require("jsonwebtoken");
const Users = require("./src/model/users");
const mongo = require("mongodb");
const Song = require("./src/model/songs");
const History = require("./src/model/history");
const author = require("./src/midleware/authorize");
const Singer = require('./src/model/singers')
const app = express();

app.use(express.urlencoded());
app.use(express.json());

//cors
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,Authorization"
  );
  next();
});
// connect mongo db
db.connectDB();

// get  user by id
app.get("/user", author.checkLogin, (req, res) => {
  const token = req.header("authorization");
  const uid = jwt.verify(token, "123")._id;
  Users.findById(uid).then((user) => {
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(402).json({ message: "User not found" });
    }
  });
});

//get 6 songs for home page
app.get("/songs", (req, res) => {
  Song.find({}, (err, result) => {
    if (!err) {
      const songs = result.splice(0, 5);
      res.status(200).json(songs);
    } else {
      res.status(400).json({ message: "ko co gi" });
    }
  });
});
//get all songs
app.get("/allsongs", (req, res) => {
  Song.find({}, (err, result) => {
    if (!err) {
      res.status(200).send(result);
    } else {
      res.status(400).json({ message: "No song" });
    }
  });
});

app.get("/unfinishedSong", author.checkLogin, (req, res, next) => {
  const token = req.header("authorization");
  const uid = jwt.verify(token, "123")._id;

  Users.findById(uid).then((user) => {
    //get current song
    const currentSong = user.currentSong;
    if (!Object.values(currentSong)[0]) {
      res.send();
    } else {
      const songID = currentSong.songID;
      //find song by current songID
      Song.findById(songID).then((song) => {
        song.timePaused = currentSong.timePaused;
        res.send(song);
      });
    }
  });
});

app.post("/currentSong", author.checkLogin, (req, res, next) => {
  const token = req.header("authorization");
  const uid = jwt.verify(token, "123")._id;
  const currentSong = {
    songID: req.body.songID,
    timePaused: req.body.timePaused,
  };
  Users.updateOne(
    { _id: uid },
    {
      $set: {
        "currentSong.songID": currentSong.songID,
        "currentSong.timePaused": currentSong.timePaused,
      },
    }
  ).then((data) => {
    if (data.modifiedCount > 0) {

    } else {

    }
  });
});

// add song to my favorite songs
app.post("/addSong", author.checkLogin, (req, res) => {
  const token = req.header("authorization");
  const result = jwt.verify(token, "123");
  const uid = result._id;
  const o_id = mongo.ObjectId(req.body.songID);
  Users.find({ _id: uid, "favorite-songs": o_id }).then((data) => {

    let action;
    //remove song if exsist in favorite song
    if (data != "") {
      action = { $pull: { "favorite-songs": o_id } };
      //add if not exsist
    } else {
      action = { $push: { "favorite-songs": o_id } };
    }
    Users.updateOne({ _id: result._id }, action).then((result) => {
      if (result.modifiedCount > 0) {
        res.status(200).json({ mesage: "Updated" });
        console.log(result.modifiedCount + " document(s) updated");
      } else {
        res.status(401).json({ message: "Updated failed" });
        console.log("Update Failed");
      }
    });
  });
});

//login
app.post("/login", (req, res, next) => {
  var email = req.body.email;
  var password = req.body.password;
  //find user with email and password
  Users.findOne({ email: email, password: password })
    .then((data) => {
      if (data) {
        //sign user id in token
        var token = jwt.sign({ _id: data._id }, "123");
        res.send({ token: token, message: "Ok" });
      } else {
        res.status(400).json("Wrong usernamne or password");
      }
    })
    .catch((err) => {
      console.log(err);
      res.json("loi server");
    });
});

//create account
app.post("/createAccount", (req, res, next) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;

  //check if email exsisted in database
  Users.findOne({ email: email }).then(user => {
    //if email exsisted => send error
    if (user) {
      res.status(400).json('Tên đăng nhập đã được sử dụng')
    } else {
      //else create account
      const User = new Users({
        email: email,
        username: username,
        password: password,

      });
      Users.insertMany(User).then((result) => {
        res.send({ message: 'register succesfully' });
      });
    }
  })

});

// get top songs with views count
app.get("/chart", (req, res, next) => {
  Song.find()
    .sort({ views: -1 })
    .limit(10)
    .then((data) => {
      res.json(data);
    });
});

// get user favorite songs
app.get("/mymusic", author.checkLogin, (req, res, next) => {
  // get token
  var token = req.header("authorization");
  var result = jwt.verify(token, "123");
  //get user
  Users.findById(result._id).then(async (data) => {
    if (data) {
      // get list of favorite song id in user
      const songs = data["favorite-songs"];
      try {
        //get list of songs corresponding list of songs id
        const records = await Song.find().where("_id").in(songs).exec();
        if (records) {
          res.json(records);
        } else {
          res.json({ message: "No favorite songs" });
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log("Can not find user");
    }
  });
});

// get historysong of user
app.get("/history", author.checkLogin, (req, res) => {
  let token = req.header("authorization");
  let result = jwt.verify(token, "123");
  let id = mongo.ObjectId(result._id);

  History.findOne({ userID: id }).then(async (data) => {
    if (!data) {
      let history = new History({ userID: id });
      History.insertMany(history, (err, result) => {
        if (err) throw err;
      });
    } else {
      // list song id
      const songIDs = data.songs;
      try {
        //get list of songs corresponding list of songs id
        const promises = songIDs.map(async id => {
          const song = await Song.findById(id).exec()
          return song
        })
        const songs = await Promise.all(promises)

        // const songs = await Song.find().where('_id').in(songIDs).exec();
        if (songs.length > 0) {
          res.send(songs)
        } else {
          res.send('No song in user history')
        }
      } catch (error) {
        console.log(error)
      }
    }
  });
});

app.post("/history", author.checkLogin, (req, res) => {
  let token = req.header("authorization");
  let songID = req.body.songID;
  let result = jwt.verify(token, "123");
  let uid = mongo.ObjectId(result._id);

  History.findOne({ userID: uid }).then(async (data) => {
    const songArray = data["songs"];
    let length = songArray.length;

    await History.find({ userID: uid, songs: songID }).then((result) => {
      if (result.length == 0) {
        // query to push song to first element in song array
        var action = { $push: { songs: { $each: [songID], $position: 0 } } };
        // execute query 
        History.updateOne({ userID: uid }, action).then((data) => {
          if (data.modifiedCount > 0) {
            length += 1;
          }
          //remove last element when array greater than 10 ele
          if (length > 10) {
            History.updateOne(
              { userID: uid },
              { $pop: { songs: 1 } }
            ).then();
          }
        });
      }
    });
    await History.findOne({ userID: uid }).then((result) => {
      res.json(result["songs"]);
    });
  });
});

app.get('/singer', async (req, res) => {

  const singerName = req.query.singerName.toLowerCase()
  const singer = await Singer.findOne({ name: singerName })
  res.send(singer)

})
//get the most song views of singer
app.get('/singerTopHit', async (req, res) => {


  const singerName = req.query.singerName
  // top 1 ranking
  console.log(singerName)
  const ranking = 1
  // get top 1 ranking song views
  const topHit = await Song.findOne({ singer: singerName }).sort({ views: -1 }).limit(ranking)
 
  res.send(topHit)
})

app.post('/followSinger', async (req, res) => {

  const singerID = mongo.ObjectId(req.body.singerID);
  const token = req.header("authorization");
  const payload = jwt.verify(token, "123");
  const uid = mongo.ObjectId(payload._id);

  // query to update
  let query;
  // user follow or unfollow
  let follow = 0
  //get user by user id and followed singer
  const user = await Users.findOne({ _id: uid, "following": singerID })

  // check user followed this singerID or not
  if (user != null) {
    //remove song if exsist in favorite song
    query = { $pull: { "following": singerID } };
    follow = -1
  } else {
    //add if not exsist
    query = { $push: { "following": singerID } };
    follow = 1
  }
  // process update
  const result = await Users.updateOne({ _id: uid }, query)

  if (result.modifiedCount > 0) {
    //  update follow of singer when user follow or unfollow
    Singer.updateOne({ _id: singerID }, { $inc: { follow: follow } }).then(result => {
      if (result.modifiedCount > 0) {
        res.status(200).json({ message: "Updated " });
      }
    })

  } else {
    console.log('ko update dc')
    res.status(401).json({ message: "Updated failed" });
  }
})

app.get('/singerSong', async (req, res) => {
  try {
    const singerName = req.query.singerName

    const songs = await Song.find({ singer: { $regex: singerName, $options: 'i' } })
   
    res.send(songs)

  } catch (error) {
    console.log(error)
  }
})
app.get('/getFollowingSinger',async (req,res)=>{

  const token = req.header("authorization");
  const payload = jwt.verify(token, "123");
  const uid = mongo.ObjectId(payload._id);
//get user info
  const user=await Users.findById(uid)
  //get singer following of singer
  const listSinger=user.following

  const records = await Singer.find().where("_id").in(listSinger).exec();
  res.send(records)
})
app.get('/randomSinger',async (req,res)=>{

  const randomSingers=await Singer.aggregate([{$sample: {size: 4}}])
  return res.send(randomSingers)
})

app.listen(process.env.PORT || 3000, () => console.log("running"));
