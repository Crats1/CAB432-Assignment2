const express = require('express');
const router = express.Router();
let Twit = require('twit');
require('dotenv').config();

let twitter = new Twit({
    consumer_key: process.env.API_KEY,
    consumer_secret: process.env.API_SECRET_KEY,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    app_only_auth: true
});

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.get('/search', (req, res, next) => {
    const queries = req.query;
    const queryWords = queries.words;
    console.log(queryWords);
    twitter.get('search/tweets', { q: queryWords, count: 100 })
        .then((response) => {
            return res.json(response.data);
        })
        .catch((error) => {
            console.error('error:', error);
            res.status(error.response.status).json(error.response.data);
            return;
        });
});

module.exports = router;
