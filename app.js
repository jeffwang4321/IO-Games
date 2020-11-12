//207.102.105.88:4141
var express = require('express'); // Import the Express module
var app = express(); // Create a new instance of Express
var server = require('http').createServer(app).listen(process.env.PORT || 8080); // Create a Node.js based http server on port 8080
app.use(express.static(__dirname + '/public')); //Get html and css from public

console.log("Server started.");

var numClients = {}; //key-value pair that stores the # of connected clients
var ingame = {}; //key-value pair that stores T/F if the game is in session(T)
var hit = {}; //key-value pair that stores the number of total hits in that room
var roomtocolor = {}; //key-value pair that stores all disctint colors in that room
var colortopoints = {}; //key-value pair that stores the points of every distinct color (Wil be issue if 2 user have the same RGB)

var io = require('socket.io')(server);
io.sockets.on('connection', function(socket){
    //On connection
    socket.playername ="";
    socket.gameid="";
    socket.playercolor="black"; 
    socket.playerpoints=0; 
    socket.emit('showtitle');
    console.log('New connection!');
    
    // Check if the game room is in session or full == 10
    socket.on('checkroom',function(gameid){
        if(ingame[gameid]===true || numClients[gameid]===10){
            socket.emit('ingame');
        } else {
            socket.emit('startgood');     
        }
    });

    // Create room or join room 
    socket.on('hostCreateNewGame',function(data){
        console.log('hostCreateNewGame' + '\n  Player: ' + data.playerName + ' joined game: ' + data.gameID );
        
        // A reference to the player's Socket.IO socket object (set values playername and gameid)
        this.playername = data.playerName;
        this.gameid = data.gameID;
        this.playercolor = data.playerColor;
        this.join(data.gameID); // join room (data.gameID)
        // console.log(io.sockets.sockets); // print everything

        //Initialize numClients to 1 else add 1 
        if (numClients[data.gameID] == undefined) {
            numClients[data.gameID] = 1;
        } else {
            numClients[data.gameID]++;
        }

        //Send a join room msg & update the total user count for display
        io.to(data.gameID).emit('addToChat', "*** " + data.playerName + " has joined ***", this.playercolor);
        io.to(data.gameID).emit('updatechatinfo', numClients[data.gameID], data.gameID);
    });


    // Send message back to the game room 
    socket.on('sendMsgToServer',function(msg){
        console.log('Game id: ' + this.gameid + ' ' + this.playername + ": " + msg);
        io.to(this.gameid).emit('addToChat', this.playername + ": " + msg, this.playercolor);
    });

    // Send alert msg when player leaves the chat
    socket.on('disconnect',function(){  
        console.log(this.gameid)       
        io.to(this.gameid).emit('addToChat', this.playername + " has left the chat", this.playercolor);
        numClients[this.gameid]--;
        //Reset all values in room if empty
        if (numClients[this.gameid] === 0){
            for (i in roomtocolor[this.gameid]){
                colortopoints[roomtocolor[this.gameid][i]] = 0;
            }
            roomtocolor[this.gameid] = [];
            hit[this.gameid] = 0;
            ingame[this.gameid] = false;
        }

        //Update the total user count for display
        io.to(this.gameid).emit('updatechatinfo', numClients[this.gameid], this.gameid);
    });


    // Shows game page, initialize game room variables
    socket.on('severshowgame',function(){
        ingame[this.gameid] = true;
        hit[this.gameid] = 0;
        io.to(this.gameid).emit('showgame');
    });

   
    // Send back player color to client
    socket.on('getcolor',function(tdid){
        ++hit[this.gameid];
        ++this.playerpoints;
        colortopoints[this.playercolor] = this.playerpoints;

        //Initialize if roomtocolor does not contain game id as key, set roomtocolor[this.gameid] to empty list
        if (!(this.gameid in roomtocolor)){
            roomtocolor[this.gameid] = [];
        }
        //Append color if roomtocolor[this.gameid] does not have the color
        if (!(roomtocolor[this.gameid].includes(this.playercolor))){
            roomtocolor[this.gameid].push(this.playercolor);
        }
        console.log(roomtocolor[this.gameid]);

        //Set new color on the board for all players
        io.to(this.gameid).emit('setcolor', tdid, this.playercolor);

        //Add new score to score board
        io.to(this.gameid).emit('addToScore', roomtocolor[this.gameid], colortopoints);

        //End game if all tiles hit, reset game room variables
        if(hit[this.gameid] === 100){
            io.to(this.gameid).emit('gameover');
            for (i in roomtocolor[this.gameid]){
                colortopoints[roomtocolor[this.gameid][i]] = 0;
            }
            hit[this.gameid] = 0;
            ingame[this.gameid] = false;
            roomtocolor[this.gameid] = [];
        }
    });

    // Reset player points to 0
    socket.on('resetpoints',function(){
        this.playerpoints = 0;
    });

});



  
