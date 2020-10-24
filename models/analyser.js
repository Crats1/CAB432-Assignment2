const {performance} = require('perf_hooks');
const natural = require('natural');
const path = require('path');
const fs = require('fs');

let Analyser = natural.SentimentAnalyzer;
let stemmer = natural.PorterStemmer;
let analyser = new Analyser('English', stemmer, 'afinn');
let tokenizer = new natural.WordPunctTokenizer();
let corpus = fs.readFileSync(path.join(__dirname, 'dictionary.txt')).toString().split('\r\n');
let spellcheck = new natural.Spellcheck(corpus);

function tokenizeText(text) {
    text = text.replace(/\@\w\w+\s?/g, '').replace(/(?:https?|ftp):\/\/[\n\S]+/g, ''); // Remove mentions and links
    return tokenizer.tokenize(text.toLowerCase()).map((word) => {
        return word.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ''); // Replace all punctuation and whitespace
    }).filter((val) => {
        return val != '' && !val.match(/^[0-9]+$/); // Remove empty and number strings
    });
}

function getCorrectWords(text) {
    return text.filter((val) => {
        return spellcheck.isCorrect(val);
    })
}

function getMisspelledWords(text) {
    let tokenizedText = tokenizeText(text);
    let correctWords = getCorrectWords(tokenizedText);
    return tokenizedText.filter((val) => {
        return correctWords.indexOf(val) <= -1;
    })
}

function getCorrections(misspelledWords) {
    const maxEditDistance = 1; // Edit distance > 1 is too slow
    let corrrections = {};
    for (let i = 0; i < misspelledWords.length; i++) {
        let word = misspelledWords[i];
        let correction = spellcheck.getCorrections(word, maxEditDistance);
        corrrections[word] = correction;
    }
    return corrrections;
}

function analyseTweets(body) {
    let t0 = performance.now();
    let tweets = body.statuses;
    for (let i = 0; i < tweets.length; i++) {
        let text = tokenizeText(tweets[i].full_text);
        let sentiment = analyser.getSentiment(text);
        tweets[i].sentiment = (!isNaN(parseFloat(sentiment)) && !isNaN(sentiment - 0) ? sentiment : 0); // Checks if sentiment is a number
        tweets[i].misspelled = getCorrections(getMisspelledWords(tweets[i].full_text));
    }
    let t1 = performance.now();
    console.log("Analysis took " + (t1 - t0) + " milliseconds.");
    return body;
}

module.exports = analyseTweets;