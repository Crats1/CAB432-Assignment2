require('dotenv').config();
const AWS = require('aws-sdk');
const express = require('express');
const redis = require('redis');
const router = express.Router();
const natural = require('natural');
const nlp = require('compromise');

const bucketName = process.env.BUCKET_NAME;
const redisClient = redis.createClient();
const {performance} = require('perf_hooks');
const s3ApiVersion = '2006-03-01';
const bucketPromise = new AWS.S3({apiVersion: s3ApiVersion}).createBucket({Bucket: bucketName}).promise();
bucketPromise.then(data => {
    console.log('Succesfully created ' + bucketName);
})
.catch(err => {
    console.error(err, err.stack);
});

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

    // Try to get Tweets from Redis
    return redisClient.get(redisKey, (err, redisReply) => {
        const expires = 900;
        if (redisReply) {
            let data = JSON.parse(redisReply);
            data.statuses = analyseTweets(data.statuses);
            return res.status(200).json(JSON.parse(redisReply));
        }
        
        // Try to get Tweets from S3
        const s3Key = `twitter-${queryWords}`;
        const params = { Bucket: bucketName, Key: s3Key };
        return new AWS.S3({apiVersion: s3ApiVersion}).getObject(params, (err, s3Reply) => {
            if (s3Reply) {
                const lastModified = Date.parse(s3Reply.LastModified);
                const timeDifferenceInMinutes = (new Date().getTime() - lastModified) / 1000 / 60;
                const lastModifiedDifference = 20;
                if (timeDifferenceInMinutes < lastModifiedDifference) {
                    let data = JSON.parse(s3Reply.Body);
                    redisClient.setex(redisKey, expires, JSON.stringify(data));
                    data.statuses = analyseTweets(data.statuses);
                    return res.status(200).json(data);
                }
            }

            // Get Tweets from Twitter API as last resort
            twitter.get('search/tweets', { q: queryWords, count: 100, lang: 'en' })
                .then((result) => {
                    redisClient.setex(redisKey, expires, JSON.stringify(result.data));
                    // Store in S3
                    const body = JSON.stringify(result.data);
                    const objectParams = { Bucket: bucketName, Key: s3Key, Body: body };
                    const uploadPromise = new AWS.S3({ apiVersion: s3ApiVersion}).putObject(objectParams).promise();

                    uploadPromise.then((data) => { 
                        console.log("Successfully uploaded data to " + bucketName + "/" + s3Key);
                    });                    

                    result.data.statuses = analyseTweets(result.data.statuses);
                    return res.json(result.data);
                })
                .catch((error) => {
                    console.error('error:', error);
                    res.status(error.response.status).json(error.response.data);
                    return;
                });            
        })
    })
});

module.exports = router;