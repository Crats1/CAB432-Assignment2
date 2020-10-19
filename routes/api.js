require('dotenv').config();
const AWS = require('aws-sdk');
const express = require('express');
const redis = require('redis');
const router = express.Router();
const natural = require('natural');
const nlp = require('compromise');

const redisClient = redis.createClient();
const {performance} = require('perf_hooks');

let Analyser = natural.SentimentAnalyzer;
let stemmer = natural.PorterStemmer;
let analyser = new Analyser('English', stemmer, 'afinn');
let Twit = require('twit');

let twitter = new Twit({
    consumer_key: process.env.API_KEY,
    consumer_secret: process.env.API_SECRET_KEY,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    app_only_auth: true
});

redisClient.on('error', (err) => {
    console.log('Error ' + err);
});

function analyseTweets(tweets) {
    let t0 = performance.now();
    for (let i = 0; i < tweets.length; i++) {
        let text = tweets[i].text;
        let doc = nlp(text);
        tweets[i].sentiment = analyser.getSentiment(text.split(' '));
        tweets[i].topics = doc.topics().list;
    }
    let t1 = performance.now();
    console.log("Analysis took " + (t1 - t0) + " milliseconds.");
    return tweets;
}

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.get('/search', (req, res, next) => {
    const queries = req.query;
    const queryWords = queries.words;
    console.log(queryWords);
    const redisKey = `twitter:${queryWords}`;

    return redisClient.get(redisKey, (err, reply) => {
        const expires = 3600;
        if (reply) {
            let data = JSON.parse(reply);
            data.statuses = analyseTweets(data.statuses);
            redisClient.expire(redisKey, expires); // Reset expiry time of key
            return res.status(200).json(JSON.parse(reply));
        }

        twitter.get('search/tweets', { q: queryWords, count: 100, lang: 'en' })
            .then((result) => {
                redisClient.setex(redisKey, expires, JSON.stringify(result.data));
                result.data.statuses = analyseTweets(result.data.statuses);
                return res.json(result.data);
            })
            .catch((error) => {
                console.error('error:', error);
                res.status(error.response.status).json(error.response.data);
                return;
            });
    })
});

module.exports = router;
