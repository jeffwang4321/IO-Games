// Note: The console.logs here appears on the client side (Chrome -> F12 -> Console)

var socket = io();

/******************* Display Navigation Functions *******************/
//Start function (show titlepage)
socket.on('showtitle',function(){
    console.log('showtitle');
    titlepage.style.display = 'block';
});

//Btn click - join (show joinpage)
function btnjoin(){
    console.log('btnjoin');
    titlepage.style.display = 'none';
    joinpage.style.display = 'block';
    document.getElementById('btncolor').style.background=randomColor() 
}

//Btn click - color (Generate random color)
function btncolor(){
    document.getElementById('btncolor').style.background=randomColor() 
}

//Random pastel color function from: https://stackoverflow.com/questions/43193341/how-to-generate-random-pastel-or-brighter-color-in-javascript/43195379
function randomColor(){ 
    return "hsla(" + ~~(360 * Math.random()) + "," + "90%,"+ "80%,1)"
}

//Btn click - start (create/ join room & show chatpage)
function btnstart(){
    console.log('btnstart');
    socket.emit('checkroom', inputGameID.value);
}

// Emit alert msg when game in progress or full
socket.on('ingame',function(){
    alert('Game in progress or full')
});

// Room is available, send join page data and create room
socket.on('startgood',function(){
    console.log('startgood');
    joinpage.style.display = 'none';
    chatpage.style.display = 'block';
    choicepage.style.display = 'block';
    scorepage.style.display = 'block';

    // Set gameID, playerName & playerColor or default to random 4 digit gameID & Anonymous
    var data = {
        gameID : inputGameID.value || (Math.random() * 10000 | 0).toString(),
        playerName : inputPlayerName.value || 'Anonymous',
        playerColor : document.getElementById('btncolor').style.background
    };
    socket.emit('hostCreateNewGame', data);
});


//Update the Game ID & connected user info on top of chat list
socket.on('updatechatinfo',function(numUsers, gameid){
    gameidtext.innerHTML = '<h3> Game ID: ' +gameid + '&#160; &#160;Users: ' +numUsers  + '/10 </h3>';
});


/******************* Chat Functions *******************/
//Btn click - send (Calls server to send chat, server checks rooms)
chatform.onsubmit = function(e){
    //prevent the form from refreshing the page
    e.preventDefault();
    
    //call sendMsgToServer socket function, with form text value as argument
    socket.emit('sendMsgToServer', chatinput.value);
    chatinput.value = "";
}

//Add a chat cell to our chat list view (Distinct client colors included!), and scroll to the bottom 
socket.on('addToChat',function(msg, playercolor){
    console.log('got a chat message');

    var messageNode = document.createTextNode(msg);
    var messageElement = document.createElement('div');
    messageElement.setAttribute("id", "chatCell");
    messageElement.style.color = playercolor;

    messageElement.appendChild(messageNode);
    document.getElementById('chattext').appendChild(messageElement);

    chattext.scrollTop = chattext.scrollHeight;   
});


//Optional for chat page (focus chat input box)
//Run on page load, alway focus chat input
document.addEventListener('DOMContentLoaded', function() {
    chatinput.focus();                     
});
    
//Run on key press, alway focus chat input
// document.onkeyup = function(){
//     chatinput.focus();  
// }


/******************* Game1 (Spam Colors) - Variables and Functions *******************/
//Game Board Color Data 
var board = [
    "", "", "", "", "", "", "", "", "", "", 
    "", "", "", "", "", "", "", "", "", "", 
    "", "", "", "", "", "", "", "", "", "", 
    "", "", "", "", "", "", "", "", "", "", 
    "", "", "", "", "", "", "", "", "", "", 
    "", "", "", "", "", "", "", "", "", "", 
    "", "", "", "", "", "", "", "", "", "", 
    "", "", "", "", "", "", "", "", "", "", 
    "", "", "", "", "", "", "", "", "", "", 
    "", "", "", "", "", "", "", "", "", "", 
]
//Store a copy of the blank board state
var blankboard = board.slice();

// Btn click - game1 (check with server to show game1)
function btngame1(){
    socket.emit('servershowgame1'); 
}

// Shows game1 page/ board
socket.on('showgame1',function(){
    choicepage.style.display = 'none';
    game1page.style.display = 'block';
    scoretext.innerHTML =""; //Empty previous scores
});

// Btn click - table node (Sends the node id and gets player color)
function tdclick(tdnode){
    console.log("Clicked node: ", tdnode.id)
    if(board[tdnode.id-1]===""){
        socket.emit('getcolor', tdnode.id);
    }
}

// Set player color to board
socket.on('setcolor', function(tdid,playercolor){
    board[tdid-1] = playercolor;
    console.log("Color: ", board[tdid-1])
    document.getElementById(tdid).style.background=playercolor
});

// Game over, reset board state and page displays
socket.on('game1over', function(){
    for(var i = 0; i < board.length; i++){
        document.getElementById((i+1).toString()).style.background='lightgray';
    }
    board = blankboard.slice();
    console.log(board, blankboard)
    choicepage.style.display = 'block';
    game1page.style.display = 'none';
    socket.emit('resetpoints');
});

//Add a chat cell to our chat list view (Distinct client colors included!), and scroll to the bottom 
socket.on('addToScore',function(roomtocolor, colortopoints){
    // var keys = Object.keys(colortopoints);
    console.log(roomtocolor);

    scoretext.innerHTML = '<div></div>';
    for (i in roomtocolor){
        console.log(roomtocolor[i]);
        console.log(roomtocolor[i] + ": " + colortopoints[roomtocolor[i]]);
        scoretext.innerHTML += '<div id="chatCell"><i style="color:' + roomtocolor[i] 
        + '" class="bx bxs-square-rounded"></i> : ' + colortopoints[roomtocolor[i]] + '</div>';
    }

    scoretext.scrollTop = scoretext.scrollHeight;   
});


/******************* Game2 (Party Blanks) - Variables and Functions *******************/
// Btn click - game2 (check with server to show game1)

// Btn Clicked - game2 (ask server to display game2)
function btngame2(){
    socket.emit('servershowgame2'); 
}

// Shows game2 page/ board
socket.on('showgame2',function(prompt){
    choicepage.style.display = 'none';
    game2page.style.display = 'block';
    game2prompt.innerHTML = prompt;
    scoretext.innerHTML =""; //Empty previous scores
});

// ASk server to show next prompt
function btnnext(){
    socket.emit('servernext'); 
}

// Show next prompt / next round
socket.on('shownext',function(prompt){
    game2prompt.innerHTML = prompt;
});

// Reveal? work in progress...
function btnreveal(){
    console.log("Hit")
    // socket.emit('serverreveal'); 
}

// socket.on('reveal',function(){
//     var cell = document.getElementsByClassName('game2Cell');
//     if (cell){
//         console.log("btnrevealhit")
//         cell.style.color = 'black';
//     }  
// });

// Answer Function
//Btn click - send (Calls server to send chat, server checks rooms)
game2form.onsubmit = function(e){
    //prevent the form from refreshing the page
    e.preventDefault();
    
    //call sendMsgToServer socket function, with form text value as argument
    socket.emit('sendgame2ToServer', game2input.value || "N/A");
    game2input.value = "";
    game2form.innerHTML = "";
}

//Add a chat cell to our chat list view (Distinct client colors included!), and scroll to the bottom 
socket.on('addTogame2',function(msg, playercolor){
    console.log('got an answer + color: ', playercolor);

    game2text.innerHTML += '<div id="game2Cell">' + msg + '<i class="bx bxs-check-circle" onclick="cellclick(' + "'" + playercolor + "'" + ');"></i></div>';    
    game2text.scrollTop = game2text.scrollHeight;   
});

// Btn click - Answer cell (Sends the node id and gets player color)
function cellclick(color){
    console.log("Clicked cell: ", color);
    socket.emit('scoregame2', color);
}

// Reset the anser input for next rounds
socket.on('resetgame2',function(){
    game2text.innerHTML = "";
    game2form.innerHTML = '<input id="game2input" style="width:69%; height:30px;" autocomplete="off" type="text" /> <input class="btn" type="submit" value="Send" />';
});

// Ask server to emit game over
function btngame2over(){
    socket.emit('servergame2over');
}

// Game over, reset game state and page displays
socket.on('game2over', function(){
    choicepage.style.display = 'block';
    game2page.style.display = 'none';
    socket.emit('resetpoints');
});




