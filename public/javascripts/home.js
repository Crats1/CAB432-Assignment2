function getInput() {
    var queryInput = 
        document.querySelector("#searchForm [name='search']");
    let query = queryInput.value;
    document.getElementById('tweets').innerHTML = "Searching for: " + query + "<br>";
    return query;
    
}

function fetchTweets(e) {
    e.preventDefault();
    let query = getInput();
    var chartArray = [];
    url=`api/search?words=${query}`;
    return fetch(url)
    .then((res) => res.json())
    .then((data) => {

        for(let i=0; i < data.statuses.length; i++){
            screenName = data.statuses[i].user.screen_name
            userName = data.statuses[i].user.name
            tweet = data.statuses[i].text
            sentiment = data.statuses[i].sentiment

            chartArray.push(sentiment)

            console.log(screenName)
            console.log(userName)
            document.getElementById('tweets').innerHTML += "<div class='userTweets'><li class='col-sm-4'><b>" + screenName + "</b><br>" + tweet + "<br>Sentiment of Tweet: " + sentiment + "</li>"   
        }


        labels =  ['Negative', 'Neutral', 'Positive']
        console.log(chartArray);
        renderChart(chartArray, labels);
    })
}

let submitForm = document.getElementById('searchForm');
submitForm.addEventListener('submit', fetchTweets);

function renderChart(data, labels) {
    var ctx = document.getElementById("myChart").getContext('2d');
    // Need to group values - Negative, Neutral, Positive
    // Negative is -1:-0.1, neutral is -0.1:0.1, positive is 0.1-1
    var neutral = []
    var negative = []
    var positive = []

    for(i=0; i < data.length; i++) {
        if (data[i] >= -0.1 && data[i] <= 0.1){

            neutral.push(data[i])
        }

        else if(data[i] <= -0.1) {
            negative.push(data[i])
        }

        else {
            positive.push(data[i])
        }
    }

    console.log(negative)
    console.log(neutral)
    console.log(positive)
    
    neg = negative.length
    neu = neutral.length
    pos = positive.length

     
    Chart.defaults.global.defaultFontColor = '#777';
    var myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sentiment',
                data: [neg, neu, pos],
                backgroundColor: ["red", "blue", "green"],
                borderWidth:1,
                borderColor:'#777',
                hoverBorderWidth:3,
                hoverBorderColor:'#000'
            }],
        },
        options: {
            title: {
                display:true,
                text:'Twitter Sentiment Graph',
                fontSize:18
            },
            legend: {
                display:true,
                position:'right',
                labels:{
                fontColor:'#000',
                }
            },
            layout: {
                padding:{
                    left:50,
                    right:0,
                    bottom:0,
                    top:0
                    } 
            },
            tooltips:{
                enabled:true
                }
        }
    });
}