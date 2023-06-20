const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const router = require("./src/Routes/route");
const commnMid = require("./src/Middleware/Auth");
const userprofile = require("./src/Models/profile");
const myDrillModel = require("./src/Models/myDrillModel");
const uploadDevice = require("./src/Models/uploadDevice");
const sncPlayerProfile = require("./src/Models/sncPlayerProfile");
const onGoingDrillModel = require("./src/Models/onGoingDrillModel");
const recommendationModel = require("./src/Models/recommendationModel");
const userModel = require("./src/Models/userModel");
const academyProfile = require("./src/Models/academyProfile");
const port = process.env.PORT || 3000

app.use(bodyParser.json());

mongoose.set('strictQuery', false);

//=====================[Multer Storage]=================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './upload/images')
    },
    filename: function (req, file, cb) {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5000000000
    }
});
//============================[ User Profile]==============================

app.use('/image', express.static('./upload/images'))
app.post("/:userId/userProfile", commnMid.jwtValidation, commnMid.authorization, upload.single('image'), async (req, res) => {
    try {
        let data = req.body;
        let file = req.file;
        let userid = req.params.userId;

        let { dob, gender, email, contact, height, weight, image, userId } = data

        data.image = `/image/${file.filename}`;
        data.userId = userid;

        let userCreated = await userprofile.create(data)
        return res.status(201).send({
            data: userCreated
        })
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        })
    }
});
//===============================[ Get Image]===============================

app.get("/:userId/getImage", commnMid.jwtValidation, commnMid.authorization, async (req, res) => {
    try {
        let body = req.query

        let getImg = await userprofile.find(body)
        return res.status(200).send({
            status: true,
            message: 'Success',
            data: getImg
        })
    }
    catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        })
    }
});

//=======================[ Upload Device]=============================================
app.use('/image', express.static('./upload/images'))
app.post("/:userId/uploadDevice", commnMid.jwtValidation, commnMid.authorization, upload.fields([{ name: 'video', maxCount: 5 }, { name: 'thumbnail', maxCount: 5 }]), async (req, res) => {
    try {
        let data = req.body;
        let file = req.files;
        let userid = req.params.userId;


        let { video, thumbnail, videoLength, title, category, tag, userId } = data;

        data.video = `/image/${file.video[0].filename}`
        data.thumbnail = `/image/${file.thumbnail[0].filename}`
        data.userId = userid;

        let uploadDeviceCreated = await uploadDevice.create(data);
        return res.status(201).send({
            data: uploadDeviceCreated
        })
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        })
    }
});
//===========================[ Get My Video]=============================
app.get("/:userId/myVideo", commnMid.jwtValidation, commnMid.authorization, async (req, res) => {
    try {
        let body = req.query;
        let userid = req.params.userId;

        let { category, title, tag } = body;

        let filter = { userId: userid }

        if (category) {
            filter.category = category;
        }
        if (title) {
            filter.title = title;
        }
        if (tag){
            filter.tag = tag;
        }

        let getVideo = await uploadDevice.find({ $or: [body, filter] });

        return res.status(200).send({
            status: true,
            message: 'Success',
            data: getVideo
        })
    }
    catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        })
    }
});
//=======================[Get All Videos (Curriculum)]==============================
app.get("/curriculum", async (req, res) => {
    try {
        let data = req.query;

        let { category, title } = data;

        let filter = {}

        if (category) {
            filter.category = category;
        }
        if (title) {
            filter.title = title;
        }

        let Upload = await uploadDevice.find({ $or: [data, filter] });

        let lastIndex = Upload.length - 1;
        let lastObject = Upload[lastIndex];

        let arr = [];

        for (var i = 0; i < Upload.length; i++) {
            data.userId = Upload[i].userId
            arr.push(data.userId)
        }

        let Alldrills = await myDrillModel.find({ userId: data.userId });

        let type = Alldrills ? true : false;

        let obj = [{
            title: lastObject.title,
            videoLength: lastObject.videoLength,
            video: lastObject.video,
            thumbnail: lastObject.thumbnail,
            category: lastObject.category,
            tag: lastObject.tag,
            isCompleted: type,
            drills: Alldrills
        }];
        // console.log(obj, "33333")

        return res.status(200).send({
            status: true,
            message: 'Success',
            data: obj
        })
    }
    catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        })
    }
});
//============================[My Drills]=======================================
app.use('/image', express.static('./upload/videos'))
app.post("/:userId/myDrills", commnMid.jwtValidation, commnMid.authorization, upload.array("videos", 100), async (req, res) => {
    try {
        let data = req.body;
        let file = req.files;
        let userid = req.params.userId;

        let { title, category, repetation, sets, videos, userId, isCompleted } = data;

        let arr = [];
        for (let i = 0; i < file.length; i++) {
            arr.push(`/image/${file[i].filename}`)
        };
        data.videos = arr;
        data.userId = userid;

        let MyDrillCreated = await myDrillModel.create(data)

        let obj = {}
        obj["_id"] = MyDrillCreated._id
        obj["title"] = MyDrillCreated.title
        obj["category"] = MyDrillCreated.category
        obj["repetation"] = MyDrillCreated.repetation
        obj["sets"] = MyDrillCreated.sets
        obj["videos"] = MyDrillCreated.videos
        obj["createdAt"] = MyDrillCreated.createdAt
        obj["userId"] = MyDrillCreated.userId
        obj["isCompleted"] = MyDrillCreated.isCompleted

        return res.status(201).send({
            status: true,
            message: 'Success',
            data: obj
        })
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        })
    }
});

//===================================[part-2 (snc Player)]===========================================
app.use('/image', express.static('./upload/images'))
app.post("/:userId/sncPlayerProfile", commnMid.jwtValidation, commnMid.authorization, upload.single('image'), async (req, res) => {
    try {
        let data = req.body;
        let file = req.file;

        let { image, Height, Weight, Age, Gender, Sport, Dominance, Training_age, Recent_injuries } = data
        data.image = `/image/${file.filename}`

        const sncPlayerCreated = await sncPlayerProfile.create(data)

        let obj = {}
        obj["image"] = sncPlayerCreated.image
        obj["Height"] = sncPlayerCreated.Height
        obj["Weight"] = sncPlayerCreated.Weight
        obj["Age"] = sncPlayerCreated.Age
        obj["Gender"] = sncPlayerCreated.Gender
        obj["Sport"] = sncPlayerCreated.Sport
        obj["Dominance"] = sncPlayerCreated.Dominance
        obj["Training_age"] = sncPlayerCreated.Training_age
        obj["Recent_injuries"] = sncPlayerCreated.Recent_injuries

        return res.status(201).send({
            Status: true,
            Message: "Successfully Created",
            data: obj
        })
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        })
    }
});

//============================[OnGoing Drills]=======================================
app.use('/image', express.static('./upload/videos'))
app.post("/:userId/OnGoingDrills", commnMid.jwtValidation, commnMid.authorization, upload.array("videos", 100), async (req, res) => {
    try {
        let data = req.body;
        let file = req.files;

        let { title, category, repetation, sets, videos, recommendation, remarks, score } = data;

        let arr = [];
        for (let i = 0; i < file.length; i++) {
            arr.push(`/image/${file[i].filename}`)
        };
        data.videos = arr;

        const OnGoingDrillCreated = await onGoingDrillModel.create(data);

        let obj = {
            _id: OnGoingDrillCreated._id,
            title: OnGoingDrillCreated.title,
            category: OnGoingDrillCreated.category,
            repetation: OnGoingDrillCreated.repetation,
            sets: OnGoingDrillCreated.sets,
            videos: OnGoingDrillCreated.videos,
            remarks: OnGoingDrillCreated.remarks,
            score: OnGoingDrillCreated.score,
            createdAt: OnGoingDrillCreated.createdAt
        };

        return res.status(201).send({
            status: true,
            message: 'Success',
            data: obj
        })
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        })
    }
});

//============================[Get OnGoing Drills]=======================================
app.get("/:userId/OnGoingDrill", commnMid.jwtValidation, commnMid.authorization, async (req, res) => {
    try {
        let data = req.query;
  

        let {  category, title } = data;

        let filter = { }

        if (category) {
            filter.category = category;
        }
        if (title) {
            filter.title = title;
        }

        // let getMyDrill = await onGoingDrillModel.find({$or:[data,filter]})
        let OnGoingDrillCreated = await onGoingDrillModel.find({ $or: [data, filter] });
        let lastIndex = OnGoingDrillCreated.length - 1;
        let lastObject = OnGoingDrillCreated[lastIndex];

        let arr = [];

        for (var i = 0; i < OnGoingDrillCreated.length; i++) {
            data.videoId = OnGoingDrillCreated[i]._id
            arr.push(data.videoId)
        }
        
        let Allrecommendations = await recommendationModel.find({ videoId: data.videoId }).select({ anecdote_no: 1, message: 1, audioFile: 1, audiolength: 1, manual: 1, createdAt: 1 });

        let obj = [{
            _id: lastObject._id,
            title: lastObject.title,
            category: lastObject.category,
            repetation: lastObject.repetation,
            sets: lastObject.sets,
            videos: lastObject.videos,
            remarks: lastObject.remarks,
            score: lastObject.score,
            recommendation: Allrecommendations
        }];
        // console.log(obj, "33333")
        return res.status(201).send({
            status: true,
            message: 'Success',
            data :obj
        }); 
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        })
    }
});

//===========================[ post Recommendation] =====================
app.use('/image', express.static('./upload/videos'))
app.post("/:userId/recommendation", commnMid.jwtValidation, commnMid.authorization, upload.single("audioFile"), async (req, res) => {
    try {
        let data = req.body;
        let file = req.file;

        let { anecdote_no, message, audioFile, audiolength, createdat, manual, videoId } = data;

        data.audioFile = `/image/${file.filename}`;

        let videoid = await onGoingDrillModel.find();
        console.log(videoid, "aaa")

        let arr = [];

        for (let i = 0; i < videoid.length; i++) {
            data.videoId = videoid[i]._id
            arr.push(data.videoId)
        }
        console.log(data.videoId, "bbb")

        const RecommendationCreated = await recommendationModel.create(data);

        let obj = [{
            videoId: data.videoId,
            anecdote_no: RecommendationCreated.anecdote_no,
            mesage: RecommendationCreated.message,
            audioFile: RecommendationCreated.audioFile,
            audiolength: RecommendationCreated.audiolength,
            createdat: RecommendationCreated.createdAt,
            manual: RecommendationCreated.manual
        }];

        return res.status(201).send({
            status: true,
            message: 'Success',
            data: obj
        })
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        })
    }
});
//==============================[Academy-Coach Profile]

app.use('/image', express.static('./upload/ProfileImages'))
app.post("/:userId/academyProfile", commnMid.jwtValidation, commnMid.authorization, upload.single('image'), async (req, res) => {
    try {
        let data = req.body;
        let file = req.file;
        let userid = req.params.userId;

        let { userId, image, admin_name, email, contact, address } = data

        data.image = `/image/${file.filename}`;
        data.userId = userid;

        const academyCreated = await academyProfile.create(data)
        return res.status(201).send({
            data: academyCreated
        })
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        })
    }
});
//=============



mongoose.connect("mongodb+srv://Cricket:4p8Pw0p31pioSP3d@cluster0.ayvqi4c.mongodb.net/Cricket-App")
    .then(() => console.log("Database is connected successfully.."))
    .catch((Err) => console.log(Err))

app.use("/", router)

app.listen(port, function () {
    console.log(`Server is connected on Port ${port} ✅✅✅`)
});


//==================================== Import the necessary modules====================================================================
//const express = require('express');
// const bodyParser = require('body-parser');
// const moment = require('moment');

// Create the express app
//const app = express();

// Use body-parser to parse JSON request bodies
// app.use(bodyParser.json());

// Create a variable to store the last set routine time
// let lastRoutineTime = null;

// // Create a route to set a routine
// app.post('/setRoutine', (req, res) => {
//     // Get the routine time from the request body
//     const routineTime = moment(req.body.routineTime);

//     // Check if a last routine time exists
//     if (lastRoutineTime) {
//         // Calculate the time 30 minutes after the last routine time
//         const blockTime = moment(lastRoutineTime).add(30, 'minutes');

//         // Check if the routine time is within the next 30 minutes of the last routine
//         if (routineTime.isBefore(blockTime)) {
//             return res.status(400).json({ error: 'Cannot set routine for next 30 minutes' });
//         }
//     }

//     // Update the last routine time
//     lastRoutineTime = routineTime;

//     // Save the routine to the database
//     // ...

//     // Send a success response
//     return res.json({ message: 'Routine set successfully' });
// });

// // Start the server
// app.listen(3000, () => {
//     console.log('Server running on port 3000');
// });
