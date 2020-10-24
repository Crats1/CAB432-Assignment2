const express = require('express');
const router = express.Router();
const getTweets = require('../models/services');

router.get('/search', (req, res, next) => {
    const queries = req.query;
    let screenName = null;
    if (queries.hasOwnProperty('screenName')) {
        screenName = queries.screenName;
    } else {
        res.status(400).json({
            error: true,
            message: "Must have 'screenName' parameter"
        });
        return;
    }
    getTweets(screenName, (data) => {
        if (data.hasOwnProperty('statuses')) {
            return res.send(data);
        }
        return res.status(data.statusCode).json({
            error: true, 
            message: data.message 
        });
    });
});

module.exports = router;