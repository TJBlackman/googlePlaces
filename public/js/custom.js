// TEMP - use old data to prevent making a million API calls while testing DOM
if (window.localStorage.oldResults) window.oldResults = JSON.parse(window.localStorage.oldResults);

// search button click
var searchBtn = document.getElementById('searchBtn');
searchBtn.addEventListener('click', sendData);

// search on enter button
var searchInput = document.querySelector('input.form-control');
searchInput.addEventListener('keydown', enter);
function enter (e){
    if (e.keyCode !== 13) return;
    e.preventDefault();
    sendData();
}

// ajax request
function sendData(){
    var userSearch = getValue();
    var xhr = new XMLHttpRequest;
    xhr.onload = function(){
        if (xhr.status === 200) {

            window.googleResults = JSON.parse(xhr.response).sort((a, b) => b.rating - a.rating);
            window.localStorage.setItem('oldResults',xhr.response); // TEMP  - persist data
            window.oldResults = JSON.parse(window.localStorage.oldResults);
            console.log(JSON.parse(xhr.response));
            buildList(window.googleResults);
            document.querySelector('input[value="rating"]').checked = true;

        }
    }
    xhr.open('POST','/api/location');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 5000;
    xhr.send(userSearch);
}

// get data from input
function getValue(){
    var searchValue = document.querySelector('input.form-control').value.trim().toLowerCase();
    return JSON.stringify({'search':searchValue});
}

const resultsDom = document.getElementById('results');
function buildList(array){
    resultsDom.innerHTML = '';
    array.forEach(item => {
        var parser = new DOMParser();
        var address = parser.parseFromString(item.adr_address, "text/html");
        var streetAddress = address.querySelector('.street-address').innerText;
        var city = address.querySelector('.locality').innerText;
        var state = address.querySelector('.region').innerText;
        var zip = address.querySelector('.postal-code').innerText;
        var open = '';
        var hoursToday = '';
        if (item.opening_hours && item.opening_hours.open_now) {
            open = 'Open Now!';
            var hoursToday = item.opening_hours.weekday_text[(new Date().getDay() - 1)];
        } else if (item.opening_hours && !item.opening_hours.open_now) {
            open = 'Closed.'
            var hoursToday = item.opening_hours.weekday_text[(new Date().getDay() - 1)];
        };

        var el = `<li class="panel panel-default">
                    <div class="panel-body row">
                        <div class="col-sm-6">
                            <h3>${item.name}</h3>
                            <address>
                                <a href="${item.url}" target="_blank" class="mapsLink">
                                    ${streetAddress}<br>
                                    ${city} ${state}, ${zip}<br>
                                </a>
                                <a class="telephone" href="tel:${item.formatted_phone_number}"><abbr title="Phone">P:</abbr> ${item.formatted_phone_number}</a>
                            </address>
                        </div>
                        <div class="col-sm-6">
                            <h3>Rating: ${item.rating}</h3>
                            <p>${open}</p>
                            <p>${hoursToday}</p>
                            <a href="${item.website}" target="_blank">View Website</a>
                        </div>
                    </div>
                </li>`
        resultsDom.innerHTML += el;
    });
}
function sortName(){
    var newResults = oldResults.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
    buildList(newResults);
}
function sortRating(){
    var newResults = oldResults.sort((a, b) => b.rating - a.rating);
    buildList(newResults);
}
function sortOpen(){
    var newResults = oldResults.sort(function(a, b){
        if (a.opening_hours && a.opening_hours.open_now === true) {return -1} else {return 1};
    });
    buildList(newResults);
}

document.querySelectorAll('.sorted input').forEach(btn => btn.addEventListener('click',sortResults))
function sortResults(e){
    switch (this.value) {
        case 'name':sortName(); break;
        case 'rating':sortRating(); break;
        case 'open':sortOpen(); break;
        default: {console.log('poop');}
    }
}