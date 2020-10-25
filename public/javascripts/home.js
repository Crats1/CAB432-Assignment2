let pageSize = 25;
let columns = [
    { headerName: "Tweet", field: "tweet" },
    { headerName: "Date", field: "date" },
    { headerName: "Sentiment", field: "sentiment"}
];
let tweets;

let gridOptions = {
    columnDefs: columns,
    rowSelection: "single",
    pagination: true,
    paginationPageSize: pageSize,
    onRowClicked: showTweetInfo,
    onFirstDataRendered: (params) => params.api.sizeColumnsToFit()
};

function evaluateSentiment(value) {
    // Negative range is from -1 to -0.05, neutral range is between -0.05 and 0.05 and positive range is from 0.05 to 1
    const threshold = 0.05;
    if (value > -threshold && value < threshold){
        return 'Neutral';
    } else if (value <= -threshold) {
        return 'Negative';
    } else {
        return 'Positive';
    }    
}

function editElementDisplay(id, value) {
    document.getElementById(id).style.display = value;
}

function showTweetInfo(event) {
    let tweet = tweets.statuses[event.rowIndex];
    let screenName = tweet.user.screen_name;
    let url = `https://twitter.com/${screenName}/status/${tweet.id_str}`;

    $('#tweet-modal').modal('show');
    document.getElementById('tweet-url').innerHTML = `From <a href='${url}'>${url}</a>`;
    document.getElementById('tweet-text').innerHTML = tweet.full_text;
    document.getElementById('tweet-user').innerHTML = `By <a href='https://twitter.com/${screenName}'>@${screenName}</a>`;
    document.getElementById('tweet-retweets').innerHTML = `Retweets: ${tweet.retweet_count}`;
    document.getElementById('tweet-favourites').innerHTML = `Favourites: ${tweet.favorite_count}`;
    document.getElementById('tweet-sentiment').innerHTML = `Sentiment: ${evaluateSentiment(tweet.sentiment)} (${tweet.sentiment.toFixed(4)})`;
    let misspellingsElement = document.getElementById('tweet-misspellings');
    if (Object.keys(tweet.misspelled).length > 0) {
        let misspellingsHTML = `<table class='table'><tr><th>Misspelling</th><th>Correction</th>`;
        for (let misspelling in tweet.misspelled) {
            let corrections = tweet.misspelled[misspelling].join(',');
            misspellingsHTML += `<tr><td>${misspelling}</td><td>${corrections}</td></tr>`;
        }
        misspellingsHTML += '</table>';
        misspellingsElement.innerHTML = misspellingsHTML;
    } else {
        misspellingsElement.innerHTML = 'No misspellings found';
    }
}

function showResultElements() {
    editElementDisplay('loading-spinner', 'none');
    editElementDisplay('myChart', 'block');
    editElementDisplay('grid', 'block');
    editElementDisplay('tweets', 'block');
}

function hideResultElements() {
    editElementDisplay('loading-spinner', 'none');
    editElementDisplay('grid', 'none');
    editElementDisplay('myChart', 'none');
}

function showNoTweetsFoundScreen() {
    hideResultElements();
    document.getElementById('tweets').innerHTML = `<h3>No tweets found</h3>`;    
}

function getInput() {
    let queryInput = document.querySelector("#searchForm [name='search']");
    let query = queryInput.value;
    document.getElementById('searchingFor').innerHTML = "Searching for: <b>" + query + "</b><br>";
    return query;
}

function renderTable(tweets) {
    let rowData = tweets.statuses.map((val) => {
        let sentiment = `${evaluateSentiment(val.sentiment)} (${val.sentiment.toFixed(4)})`;
        return {
            tweet: val.full_text,
            date: val.created_at,
            sentiment: sentiment
        }
    });
    gridOptions.api.setRowData(rowData);
}

function fetchTweets(e) {
    e.preventDefault();
    let query = getInput();
    url=`api/search?screenName=${query}`;
    editElementDisplay('loading-spinner', 'block');
    return fetch(url)
    .then((res) => res.json())
    .then((data) => {
        tweets = data;
        if (data.hasOwnProperty('error') && data.error) {
            showNoTweetsFoundScreen();
            return;
        }
        let chartArray = data.statuses.map((val) => val.sentiment);
        showResultElements();
        document.getElementById('tweets').innerHTML = `<h3>Tweets from <a href='https://twitter.com/${query}'>@${query}</a></h3>`;
        renderTable(data);
        let labels =  ['Negative', 'Neutral', 'Positive'];
        renderChart(chartArray, labels);
    })
    .catch((err) => {
        console.log(err);
        showNoTweetsFoundScreen();
    });
}

function renderChart(data, labels) {
    let ctx = document.getElementById("myChart").getContext('2d');
    let neutral = []
    let negative = []
    let positive = []
    
    for(let i = 0; i < data.length; i++) {
        let sentiment = evaluateSentiment(data[i]);
        if (sentiment === 'Neutral') {
            neutral.push(data[i])
        } else if (sentiment === 'Negative') {
            negative.push(data[i])
        } else {
            positive.push(data[i])
        }
    }    
     
    Chart.defaults.global.defaultFontColor = '#777';
    let myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sentiment',
                data: [negative.length, neutral.length, positive.length],
                backgroundColor: ["red", "blue", "green"],
                borderWidth: 1,
                borderColor: '#777',
                hoverBorderWidth: 3,
                hoverBorderColor:'#000'
            }],
        },
        options: {
            title: {
                display: true,
                text: 'Twitter Sentiment Graph',
                fontSize: 18
            },
            legend: {
                display: true,
                position: 'right',
                labels: {
                    fontColor:'#000',
                }
            },
            layout: {
                padding: {
                    left: 50,
                    right: 0,
                    bottom: 0,
                    top: 0
                }
            },
            tooltips: {
                enabled: true
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    let grid = document.getElementById('grid');
    new agGrid.Grid(grid, gridOptions);
});

let submitForm = document.getElementById('searchForm');
submitForm.addEventListener('submit', fetchTweets);
hideResultElements();