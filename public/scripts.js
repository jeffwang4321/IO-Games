// Note: The console.logs here appears on the client side (Chrome -> F12 -> Console)

var socket = io();

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

//Btn click - start (create/ join room & show chatpage)
function btnstart(){
    socket.emit('checkroom', inputGameID.value);

}

// Emit alert msg when game in progress or full
socket.on('ingame',function(){
    alert('Game in progress or full')
});

// Room is available, send join page data and create room
socket.on('startgood',function(){
    console.log('btnstart');
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

// Btn click - game1 (check with server to show game1)
function btngame1(){
    socket.emit('severshowgame'); 
}

// Shows game1 page/ board
socket.on('showgame',function(){
    choicepage.style.display = 'none';
    gamepage.style.display = 'block';
});


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
document.onkeyup = function(){
    chatinput.focus();  
}


//Update the Game ID & connected user info on top of chat list
socket.on('updatechatinfo',function(numUsers, gameid){
    gameidtext.innerHTML = '<h3> Game ID: ' +gameid + '&#160; &#160;Users: ' +numUsers  + '/10 </h3>';
});

//Random pastel color function from: https://stackoverflow.com/questions/43193341/how-to-generate-random-pastel-or-brighter-color-in-javascript/43195379
function randomColor(){ 
    return "hsla(" + ~~(360 * Math.random()) + "," + "90%,"+ "80%,1)"
}

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
socket.on('gameover', function(){
    for(var i = 0; i < board.length; i++){
        document.getElementById((i+1).toString()).style.background='lightgray';
    }
    board = blankboard.slice();
    console.log(board, blankboard)
    choicepage.style.display = 'block';
    gamepage.style.display = 'none';
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