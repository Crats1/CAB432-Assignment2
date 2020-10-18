const express = require('express');
const router = express.Router();
const natural = require('natural');
const nlp = require('compromise');

const {performance} = require('perf_hooks');

let Analyser = natural.SentimentAnalyzer;
let stemmer = natural.PorterStemmer;
let analyser = new Analyser('English', stemmer, 'afinn');
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
    twitter.get('search/tweets', { q: queryWords, count: 100, lang: 'en' })
        .then((result) => {
            let t0 = performance.now();
            for (let i = 0; i < result.data.statuses.length; i++) {
                let text = result.data.statuses[i].text;
                let doc = nlp(text);
                result.data.statuses[i].sentiment = analyser.getSentiment(text.split(' '));
                result.data.statuses[i].topics = doc.topics().list;
            }
            let t1 = performance.now();
            console.log("Analysis took " + (t1 - t0) + " milliseconds.")
            return res.json(result.data);
        })
        .catch((error) => {
            console.error('error:', error);
            res.status(error.response.status).json(error.response.data);
            return;
        });
});

module.exports = router;
