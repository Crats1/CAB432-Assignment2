const express = require('express');
const router = express.Router();
const getTweets = require('../models/services');
const pageTitle = 'Home Page'

router.get('/', function(req, res, next) {
    const queries = req.query;
    let queryWords = null;
    if (queries.hasOwnProperty('words')) {
        queryWords = queries.words;
    } else {
        return res.render('index', { title: pageTitle, tweets: [] });
    }
    getTweets(queryWords, (data) => {
        return res.render('index', { title: pageTitle, tweets: data });
    });
});

module.exports = router;
