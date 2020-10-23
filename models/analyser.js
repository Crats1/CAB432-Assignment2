const {performance} = require('perf_hooks');
const natural = require('natural');
const nlp = require('compromise');

let Analyser = natural.SentimentAnalyzer;
let stemmer = natural.PorterStemmer;
let analyser = new Analyser('English', stemmer, 'afinn');

function analyseTweets(tweets) {
    let t0 = performance.now();
    for (let i = 0; i < tweets.length; i++) {
        let text = tweets[i].text;
        let doc = nlp(text);
        tweets[i].sentiment = analyser.getSentiment(text.split(' ')); // Analyse sentiment
        tweets[i].topics = doc.topics().list; // Analyse topics
    }
    let t1 = performance.now();
    console.log("Analysis took " + (t1 - t0) + " milliseconds.");
    return tweets;
}

module.exports = analyseTweets;