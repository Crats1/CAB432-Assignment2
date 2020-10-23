function getInput() {
    var queryInput = document.querySelector("#searchForm [name='search']");
    let query = queryInput.value;
    document.getElementById('tweets').innerHTML = "Searching for: " + query + "<br>";
    return query;  
}

function fetchTweets(e) {
    e.preventDefault();
    let query = getInput();
    url = `api/search?words=${query}`;
    return fetch(url)
        .then((res) => res.json())
        .then((data) => {
            for(let i=0; i < data.statuses.length; i++){
                let screenName = data.statuses[i].user.screen_name;
                let userName = data.statuses[i].user.name;
                let tweet = data.statuses[i].text;
                let HTMLString = "<div class='userTweets'><li class='col-sm-4'><b>" + screenName + "</b><br>" + tweet + "</li>";
                console.log(screenName);
                console.log(userName);
                document.getElementById('tweets').innerHTML += HTMLString
            }
        })
        .catch((error) => {
            console.log(error);
        })
}

document.getElementById('searchForm').addEventListener('submit', fetchTweets);
