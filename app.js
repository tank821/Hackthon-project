require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const axios = require('axios');
const { S3Client } = require('@aws-sdk/client-s3')
const cors = require('cors');
const ejs = require('ejs');
const multer = require('multer');
const { getJson } = require("serpapi");

const app = express();
const PORT = 3000;
const path = require('path');
const uploadToOpenai = require('./openai');
const uploadToGoogleLens = require('./lensapi')

app.set('view engine','ejs');
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// app.use(cors()); // Enable CORS
app.use(cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));


  const s3 = new S3Client()

// Set up Multer-S3
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'myhackthon',
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + '-' + file.originalname);
        }
    })
});

// Image upload endpoint
// app.post('/upload', upload.single('image'), async (req, res) => {
//     const image = req.file; // Access the uploaded file
//     if (!image) {
//         return res.status(400).send('No image uploaded.');
//     }

//     try {
//         const result = await uplaodToOpenai(image.buffer);

//         res.json(result);
        
//     } catch (error) {
//        y console.error(error);
//         res.status(500).send('Error processing image with OpenAI API');
//     }
// });

app.post('/upload2', upload.single('file'),  async (req, res) => {
    console.log(req.file);
    console.log("upload2 invoked!!!!");
    // console.log("file location =>" + req.file.location);
    const image = req.file; // Access the uploaded file

    // if (!image) {
    //     return res.status(400).send('No image uploaded.');
    // }

    try {
        // const data = await uploadToGoogleLens();
        const json = await getJson({
            engine: "google_lens",
            url: req.file.location,
            api_key: process.env.GOOGLE_LENS_API_KEY
        }); 
        const result = json['visual_matches'];
        console.log(result);
        const data = result.map((r) => {return {title: r.title || '', link: r.link || '', thumbnail: r.thumbnail || '', source: r.source}}) 

        // res.status(200).json(data);
        res.render('index', {data:data})
    } catch (error) {
        console.error(error);

        res.status(500).send('Error processing image with OpenAI API');
    }
});

app.get('/', async (req, res)=>{
    res.render('index', {data:[]});
});
// INTENTIONAL BUG (for webhook/code-review testing): references an undefined
// variable `count`, so this endpoint throws a ReferenceError on every request.
app.get('/health', async (req, res) => {
    res.status(200).json({ status: 'ok', uptime: count });
});
app.get('/openai', async (req, res) => {
    try {
        const result = await uploadToOpenai();
        var content = result.message.content.replace(/`/g, '');
        content = content.replace(/^json\s*/, '');
        console.log(content); 
        const parts = JSON.parse(content);
        res.render('openai', { parts });
    } catch (error) {
      console.error("Error processing image:", error);
      res.status(500).json({ error: "Error processing image" }); // Send error response
    }
  });
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});