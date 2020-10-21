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
    url=`api/search?words=${query}`;
    return fetch(url)
    .then((res) => res.json())
    .then((data) => {

        for(let i=0; i < data.statuses.length; i++){
            screenName = data.statuses[i].user.screen_name
            userName = data.statuses[i].user.name
            tweet = data.statuses[i].text

            console.log(screenName)
            console.log(userName)
            document.getElementById('tweets').innerHTML += "<div class='userTweets'><li class='col-sm-4'><b>" + screenName + "</b><br>" + tweet + "</li>"   
        }
    })
}

let submitForm = document.getElementById('searchForm');
submitForm.addEventListener('submit', fetchTweets);
