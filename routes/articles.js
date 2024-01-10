const express = require('express');
const router = express.Router()
const Model = require('../model/article');
var bodyParser = require('body-parser');
var fs = require('fs');
const cors = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type");
    next();
};
const path = require("path");
router.use(express.static(path.join(__dirname, "./uploads/")));
router.use(express.json())
router.use(cors)
router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())
var multer = require('multer');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "../front/public")
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
    }
});

var upload = multer({ storage: storage })
router.post("/upload", upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'content', maxCount: 1 }]), (req, res) => {
    let fullDateOrder = new Date()
    let dateOrder = fullDateOrder.getDate()
    let monthOrder = fullDateOrder.getMonth() + 1
    let hourOrder = fullDateOrder.getHours()
    let minuteOrder = fullDateOrder.getMinutes()
    let secondOrder = fullDateOrder.getSeconds()
    if (dateOrder < 10) {
        dateOrder = "0" + dateOrder
    }
    if (monthOrder < 10) {
        monthOrder = "0" + monthOrder
    }
    if (hourOrder < 10) {
        hourOrder = "0" + hourOrder
    }
    if (minuteOrder < 10) {
        minuteOrder = "0" + minuteOrder
    }
    if (secondOrder < 10) {
        secondOrder = "0" + secondOrder
    }
    const article = new Model({
        sortFodder: fullDateOrder.getTime(),
        date: dateOrder + "/" + monthOrder + "/" + fullDateOrder.getFullYear() + " " 
                + hourOrder + ":" + minuteOrder + ":" + secondOrder,
        title: req.body.title,
        description: req.body.description,
        src: req.body.src,
        thumbnail: req.files.thumbnail[0].filename,
        content: req.files.content[0].filename
    })
    article.save()
});
router.get('/get_articles', async (req, res) => {
    try {
        const articles = await Model.find().sort({"sortFodder": -1})
        res.json(articles)
    } catch (err) {
        res.status(500).json({message: err.message})
    }
});
router.get('/get_latest_articles', async (req, res) => {
    try {
        const articles = await Model.find().sort({"sortFodder": -1}).limit(6)
        res.json(articles)
    } catch (err) {
        res.status(500).json({message: err.message})
    }
});
router.get('/get_one_article/:id', async (req, res) => {
    try{
        const data = await Model.findById(req.params.id);
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})
router.patch('/update/:id',  upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'content', maxCount: 1 }]), async (req, res) => {
    try {
        fs.unlink("../front/public/" + req.body.oldThumbnail, function (err) {
            if (err) throw err;
        });
        fs.unlink("../front/public/" + req.body.oldContent, function (err) {
            if (err) throw err;
        });
        const result = await Model.findByIdAndUpdate(
            req.params.id, 
                {title: req.body.title, 
                description: req.body.description,
                src: req.body.src,
                thumbnail: req.files.thumbnail[0].filename, 
                content: req.files.content[0].filename}, 
            {new: true}
        )
        res.send(result)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})
router.delete('/delete', async (req, res) => {
    const articles = req.body.articlesToDelete
    try {
        for (let i in articles) {
            fs.unlink("../front/public/" + articles[i].thumbnail, function (err) {
                if (err) throw err;
            }); 
            fs.unlink("../front/public/" + articles[i].content, function (err) {
                if (err) throw err;
            });
            const data = await Model.findByIdAndDelete(articles[i]._id)
            res.send(data.name)
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }   
})
module.exports = router;