require('dotenv').config();
const AWS = require('aws-sdk');
const redis = require('redis');
const Twit = require('twit');
const analyseTweets = require('./analyser');

const redisClient = redis.createClient();
const bucketName = process.env.BUCKET_NAME;
const s3ApiVersion = '2006-03-01';
const bucketPromise = new AWS.S3({apiVersion: s3ApiVersion}).createBucket({Bucket: bucketName}).promise();
bucketPromise.then(data => {
    console.log('Succesfully created ' + bucketName);
})
.catch(err => {
    console.error(err, err.stack);
});

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

function storeInRedis(redisKey, body) {
    const expires = 900;
    redisClient.setex(redisKey, expires, JSON.stringify(body));
}

function storeInS3(s3Key, body) {
    const objectParams = { Bucket: bucketName, Key: s3Key, Body: body };
    const uploadPromise = new AWS.S3({ apiVersion: s3ApiVersion}).putObject(objectParams).promise();

    uploadPromise.then((data) => { 
        console.log("Successfully uploaded data to " + bucketName + "/" + s3Key);
    });      
}

function getTweets(screenName, callBack) {
    // Try to get Tweets from Redis
    const redisKey = `twitter:${screenName}`;
    return redisClient.get(redisKey, (err, redisReply) => {
        if (redisReply) {
            console.log('Fetching from Redis');
            let data = JSON.parse(redisReply);
            data = analyseTweets(data);
            return callBack(data);
        }
        
        // Try to get Tweets from S3
        const s3Key = `twitter-${screenName}`;
        const params = { Bucket: bucketName, Key: s3Key };
        return new AWS.S3({apiVersion: s3ApiVersion}).getObject(params, (err, s3Reply) => {
            if (s3Reply) {
                const lastModified = Date.parse(s3Reply.LastModified);
                const timeDifferenceInMinutes = (new Date().getTime() - lastModified) / 1000 / 60;
                const lastModifiedDifference = 20;
                if (timeDifferenceInMinutes < lastModifiedDifference) {
                    console.log('Fetching from S3');
                    let data = JSON.parse(s3Reply.Body);
                    storeInRedis(redisKey, data);
                    data = analyseTweets(data);
                    return callBack(data);
                }
            }
            // Get Tweets from Twitter API as last resort
            console.log('Fetching from Twitter API');
            twitter.get('statuses/user_timeline', { screen_name: screenName, count: 200, tweet_mode: 'extended' })
                .then((result) => {
                    let body = { statuses: result.data };
                    // storeInRedis(redisKey, body);
                    // storeInS3(s3Key, body);
                    body = analyseTweets(body);
                    return callBack(body);
                })
                .catch((error) => {
                    console.error('error:', error);
                    return callBack(error);
                });
        });
    });
}

module.exports = getTweets;