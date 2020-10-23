const express = require('express');
const router = express.Router();
const getTweets = require('../models/services');

router.get('/search', (req, res, next) => {
    const queries = req.query;
    const queryWords = queries.words;
    console.log(queryWords);
    const redisKey = `twitter:${queryWords}`;
    getTweets(queryWords, (data) => {
        return res.send(data);
    });

});

module.exports = router;