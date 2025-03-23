// static/script.js
// Adding sound effects
const clickSound = new Audio("static/click.mp3");
const matchSound = new Audio("static/match.mp3");
const victorySound = new Audio("static/victory.mp3"); // Add victory sound

var em = ["💐", "🌹", "🌻", "🏵️", "🌺", "🌴", "🌈", "🍓", "🍒", "🍎", "🍉", "🍊", "🥭", "🍍", "🍋", "🍏", "🍐", "🥝", "🍇", "🥥", "🍅", "🌶️", "🍄", "🧅", "🥦", "🥑", "🍔", "🍕", "🧁", "🎂", "🍬", "🍩", "🍫", "🎈"];

// Shuffling the array
var tmp, c, p = em.length;
if (p) while (--p) {
    c = Math.floor(Math.random() * (p + 1));
    tmp = em[c];
    em[c] = em[p];
    em[p] = tmp;
}

// Variables
var pre = "", pID, ppID = 0, turn = 0, t = "transform", flip = "rotateY(180deg)", flipBack = "rotateY(0deg)", time, mode;
var username; // Variable to store the username
var min, sec, moves; // Define these variables for timer and moves
var processing = false; // Flag to prevent clicks during animations

// Resizing Screen
window.onresize = init;
function init() {
    W = innerWidth;
    H = innerHeight;
    $('body').height(H + "px");
    $('#ol').height(H + "px");
}

// Showing instructions (now also grid size selection)
window.onload = function () {
    showLoginOrGrid(); // Show login or grid selection
};

function showLoginOrGrid() {
    // If the user is logged in, fetch the username from the server
    fetch('/get_username')
        .then(response => response.json())
        .then(data => {
            if (data.username) {
                username = data.username;
                showGridSelection();
            } else {
                // If not logged in, show the login prompt
                window.location.href = '/login';
            }
        })
        .catch(error => console.error('Error:', error));
}

function showGridSelection() {
    $("#ol").html(`<center><div id="inst"><h3>Welcome, ${username}!</h3>Instructions For Game<br/><br/><li>Make pairs of similar blocks by flipping them.</li><li>To flip a block, click on it.</li><li>If two blocks you clicked are not similar, they will be flipped back.</li><p style="font-size:18px;">Choose one of the following mode to start the game.</p></div><button onclick="start(3, 4)">3 x 4</button> <button onclick="start(4, 4)">4 x 4</button><button onclick="start(4, 5)">4 x 5</button><button onclick="start(5, 6)">5 x 6</button><button onclick="start(6, 6)">6 x 6</button></center>`);
    $("#ol").fadeIn(500);
}

// Starting the game
function start(r, l) {
    // Reset game state
    processing = false;
    turn = 0;
    ppID = 0;
    pre = "";
    
    // Timer and moves
    min = 0, sec = 0, moves = 0;
    $("#time").html("Time: 00:00");
    $("#moves").html("Moves: 0");
    
    // Clear any existing timer
    clearInterval(time);
    
    time = setInterval(function () {
        sec++;
        if (sec == 60) {
            min++; sec = 0;
        }
        if (sec < 10)
            $("#time").html("Time: 0" + min + ":0" + sec);
        else
            $("#time").html("Time: 0" + min + ":" + sec);
    }, 1000);

    rem = (r * l) / 2, noItems = rem;
    mode = r + "x" + l;

    // Generating item array and shuffling it
    var items = [];
    for (var i = 0; i < noItems; i++)
        items.push(em[i]);
    for (var i = 0; i < noItems; i++)
        items.push(em[i]);

    var tmp, c, p = items.length;
    if (p) while (--p) {
        c = Math.floor(Math.random() * (p + 1));
        tmp = items[c];
        items[c] = items[p];
        items[p] = tmp;
    }

    // Creating table
    $("table").html("");
    var n = 1;
    for (var i = 1; i <= r; i++) {
        $("table").append("<tr>");
        for (var j = 1; j <= l; j++) {
            $("table").append(`<td id='${n}' onclick="change(${n})"><div class='inner'><div class='front'></div><div class='back'><p>${items[n - 1]}</p></div></div></td>`);
            n++;
        }
        $("table").append("</tr>");
    }

    // Hiding instructions screen
    $("#ol").fadeOut(500);
}

function change(x) {
    // Don't allow clicks while processing or for already matched/flipped cards
    if (processing || turn === 2 || $("#" + x + " .inner").attr("flip") === "block" || ppID === x) {
        return;
    }
    
    // Play click sound
    clickSound.play();

    // Variables
    let i = "#" + x + " .inner";
    let f = "#" + x + " .inner .front";
    let b = "#" + x + " .inner .back";

    // Flip the card
    $(i).css(t, flip);

    if (turn === 1) {
        // Second card flipped
        processing = true; // Prevent more clicks until animation completes
        
        // Increase moves
        moves++;
        $("#moves").html("Moves: " + moves);
        
        // Check if cards match
        if (pre !== $(b).text()) {
            // Cards don't match
            setTimeout(function () {
                $(pID).css(t, flipBack);
                $(i).css(t, flipBack);
                ppID = 0;
                turn = 0;
                processing = false; // Allow clicks again
            }, 1000);
        } else {
            // Cards match
            rem--;
            $(i).attr("flip", "block");
            $(pID).attr("flip", "block");
            matchSound.play();
            
            setTimeout(function() {
                turn = 0;
                ppID = 0;
                processing = false; // Allow clicks again
                
                // Check for game completion
                if (rem === 0) {
                    gameComplete();
                }
            }, 500);
        }
    } else {
        // First card flipped
        pre = $(b).text();
        ppID = x;
        pID = i;
        turn = 1;
    }
}

function gameComplete() {
    clearInterval(time);
    
    // Play victory sound when game is completed
    victorySound.play();
    
    let timeString;
    if (min === 0) {
        timeString = `${sec} seconds`;
    } else {
        timeString = `${min} minute(s) and ${sec} second(s)`;
    }
    
    setTimeout(function () {
        $("#ol").html(`<center><div id="iol"><h2>Congrats, ${username}!</h2><p style="font-size:23px;padding:10px;">You completed the ${mode} mode in ${moves} moves. It took you ${timeString}.</p><p style="font-size:18px">Comment Your Score!<br/>Play Again?</p><button onclick="start(3, 4)">3 x 4</button> <button onclick="start(4, 4)">4 x 4</button><button onclick="start(4, 5)">4 x 5</button><button onclick="start(5, 6)">5 x 6</button><button onclick="start(6, 6)">6 x 6</button> <button onclick="showGridSelection()">Change Grid Size</button></div></center>`);
        $("#ol").fadeIn(750);
        saveScore(); // Save score after game completion
    }, 1500);
}

$(document).ready(function () {
    $("#exitGame").click(function () {
        let confirmExit = confirm("Are you sure you want to exit the game?");
        if (confirmExit) {
            window.close();
        }
    });

    $("#changeGridSize").click(function () {
        clearInterval(time);
        showGridSelection();
    });
});

// Function to save the score
function saveScore() {
    fetch('/save_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            moves: moves,
            time: (min * 60) + sec, // Convert time to seconds
            mode: mode
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Score saved:', data);
        // Optionally, you can display a message to the user that the score was saved.
    })
    .catch(error => {
        console.error('Error saving score:', error);
        // Optionally, you can display an error message to the user.
    });
}