//207.102.105.88:4141
var express = require('express'); // Import the Express module
var app = express(); // Create a new instance of Express
var server = require('http').createServer(app).listen(process.env.PORT || 8080); // Create a Node.js based http server on port 8080
app.use(express.static(__dirname + '/public')); //Get html and css from public

console.log("Server started.");

var numClients = {}; //key-value pair that stores the # of connected clients
var ingame = {}; //key-value pair that stores T/F if the game is in session(T)

//Game all Variables
var roomtocolor = {}; //key-value pair that stores all disctint colors in that room
var colortopoints = {}; //key-value pair that stores the points of every distinct color (Wil be issue if 2 user have the same RGB)

//Game1 Variables
var hit = {}; //key-value pair that stores the number of total hits in that room

//Game2 Variables
var round = {}
var PromptPoolAll = {}; 

var io = require('socket.io')(server);
io.sockets.on('connection', function(socket){
    //On connection
    socket.playername ="";
    socket.gameid="";
    socket.playercolor="black"; 
    socket.playerpoints=0; 
    socket.emit('showtitle');
    console.log('New connection!');


    /**************************** Room/ View Functions ****************************/
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

    // Check if the game room is in session or full == 10
    socket.on('checkroom',function(gameid){
        if(ingame[gameid]===true || numClients[gameid]===10){
            socket.emit('ingame');
        } else {
            socket.emit('startgood');     
        }
    });

    // Send alert msg when player leaves the chat
    socket.on('disconnect',function(){  
        console.log("Disconnect: Game room: " + this.gameid + ", Player name: " + this.playername)       
        io.to(this.gameid).emit('addToChat', "*** " + this.playername + " has left ***", this.playercolor);
        numClients[this.gameid]--;
        //Reset all values in room if empty
        if (numClients[this.gameid] === 0){
            for (i in roomtocolor[this.gameid]){
                colortopoints[roomtocolor[this.gameid][i]] = 0;
            }
            roomtocolor[this.gameid] = [];
            hit[this.gameid] = 0;
            ingame[this.gameid] = false;
            round[this.gameid] = 0;
            PromptPoolAll[this.gameID] = [];
        }

        //Update the total user count for display
        io.to(this.gameid).emit('updatechatinfo', numClients[this.gameid], this.gameid);
    });


    /**************************** Chat Functions ****************************/
    // Send message back to the game room 
    socket.on('sendMsgToServer',function(msg){
        console.log('Game id: ' + this.gameid + ' ' + this.playername + ": " + msg);
        io.to(this.gameid).emit('addToChat', this.playername + ": " + msg, this.playercolor);
    });
    

    /**************************** Game1 Functions ****************************/
    // Shows game page, initialize game room variables
    socket.on('servershowgame1',function(){
        ingame[this.gameid] = true;
        hit[this.gameid] = 0;
        io.to(this.gameid).emit('showgame1');
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
            io.to(this.gameid).emit('game1over');
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


    /**************************** Game2 Functions ****************************/
    // Shows game page, initialize game room variables
    socket.on('servershowgame2',function(){
        ingame[this.gameid] = true;
        round[this.gameid] = 0;
        PromptPoolAll[this.gameid] = shuffle(PromptPool).slice();
        io.to(this.gameid).emit('showgame2', PromptPoolAll[this.gameid][round[this.gameid]]);
    });

    // Skip the prompt for all, reset board
    socket.on('servernext',function(){
        ++round[this.gameid];
        io.to(this.gameid).emit('shownext', PromptPoolAll[this.gameid][round[this.gameid]]);
        io.to(this.gameid).emit('resetgame2');
    });

    // Send message back to the game room 
    socket.on('sendgame2ToServer',function(msg){
        console.log('Game id: ' + this.gameid + ' ' + this.playername + ": " + msg +" , " + this.playercolor);
        io.to(this.gameid).emit('addTogame2', msg, this.playercolor);
    });

    // Reveal answers
    socket.on('serverreveal',function(){
        io.to(this.gameid).emit('reveal');
    });

    // All player score for game 2
    socket.on('scoregame2',function(color){
        if(colortopoints[color] === undefined){
            colortopoints[color] = 0;
        }
        ++colortopoints[color];

        //Initialize if roomtocolor does not contain game id as key, set roomtocolor[this.gameid] to empty list
        if (!(this.gameid in roomtocolor)){
            roomtocolor[this.gameid] = [];
        }
        //Append color if roomtocolor[this.gameid] does not have the color
        if (!(roomtocolor[this.gameid].includes(color))){
            roomtocolor[this.gameid].push(color);
        }
        io.to(this.gameid).emit('addToScore', roomtocolor[this.gameid], colortopoints);
        ++round[this.gameid];
        io.to(this.gameid).emit('shownext', PromptPoolAll[this.gameid][round[this.gameid]]);
        io.to(this.gameid).emit('resetgame2');
    });

    // Game over to all players, reset
    socket.on('servergame2over',function(){
        io.to(this.gameid).emit('game2over');
            for (i in roomtocolor[this.gameid]){
                colortopoints[roomtocolor[this.gameid][i]] = 0;
            }
            ingame[this.gameid] = false;
            roomtocolor[this.gameid] = [];
            round[this.gameid] = 0;
            PromptPoolAll[this.gameID] = [];
            io.to(this.gameid).emit('resetgame2');
    });  


    /**************************** Game3 Functions ****************************/
    // Shows game page, initialize game room variables
    socket.on('servershowgame3',function(){
        ingame[this.gameid] = true;
        round[this.gameid] = 0;
        io.to(this.gameid).emit('showgame3');
    });


    // Game over to all players, reset
    socket.on('servergame3over',function(){
        io.to(this.gameid).emit('game3over');
            for (i in roomtocolor[this.gameid]){
                colortopoints[roomtocolor[this.gameid][i]] = 0;
            }
            ingame[this.gameid] = false;
            roomtocolor[this.gameid] = [];
            round[this.gameid] = 0;
            PromptPoolAll[this.gameID] = [];
            io.to(this.gameid).emit('resetgame3');
    });  

    // Send heart back to the game room 
    socket.on('sendg3ToServer', function(msg){
        ++round[this.gameid];
        io.to(this.gameid).emit('addTogame3', msg, this.playercolor, round[this.gameid]);
    });

    // All player score for game 2
    socket.on('flipgame3',function(msg, thisbtn){
        console.log("flip3: ", msg, thisbtn);
        io.to(this.gameid).emit('flipclient', msg, thisbtn);
    });

    //set score for all players after next round is clicked
    socket.on('g3setscore',function(score){
        this.playerpoints += score;
        colortopoints[this.playercolor] = this.playerpoints;

        //Initialize if roomtocolor does not contain game id as key, set roomtocolor[this.gameid] to empty list
        if (!(this.gameid in roomtocolor)){
            roomtocolor[this.gameid] = [];
        }
        //Append color if roomtocolor[this.gameid] does not have the color
        if (!(roomtocolor[this.gameid].includes(this.playercolor))){
            roomtocolor[this.gameid].push(this.playercolor);
        }
        io.to(this.gameid).emit('addToScore', roomtocolor[this.gameid], colortopoints);
    });


    // Skip reset board
    socket.on('serverg3next',function(){
        round[this.gameid] = 0;
        io.to(this.gameid).emit('resetgame3');
    });


});


/*
 * Javascript implementation of Fisher-Yates shuffle algorithm
 * http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
 */
function shuffle(array) {
    var currentIndex = array.length;
    var temporaryValue;
    var randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}


//Game 2 Prompts and shuffle function
var PromptPool = [
    "_____ is the end of humanity!",
    "_____ made _____ GREAT again!",
    "What is the hardest thing about life?",
    "You are running for president, what is your slogan?",
    "Nobody ever _____ because _____",
    "What is the meaning of life?",
    "I would sacrifice _____ for _____",
    "Something on my bucketlist is _____",
    "I'm breaking up with you because _____",
    "Dogs are amazing because _____",
    "Sorry, I can't wear a mask. I have a medical condition called _____",
    "It's not over until _____",
    "People talk about politics but don't know that _____",
    "If the _____ doesn't _____, I DON'T want it!",
    "Nothing is more of a turn off than _____",
    "What's worse than _____ is _____",
    "I have a hundred reasons to _____", 
    "What's a collab that would fail miserably?",
    "Today is the day _____",
    "Honestly bro... Things haven't been the same since _____",
    "Listening to _____ just takes me back to a simpler time...",
    "People spend 1k on a phone but _____",
    "During Covid, the best vacation spot is _____",
    "The EASIEST way to be best friends with someone is if you _____",
    "_____ is _____",
    "What is something people do but NEVER talk about?",
    "That it! _____ was the final straw!",
    "If I had _____, I wouldn't have _____",
    "I don't believe in love, I only believe in _____",
    "Kids these days will never understand _____",
    "I gave up _____ for _____",
    "I HATE kids these days because _____",
    "Education is _____",
    "My favourite game to play is _____",
    "First comes _____, then comes _____, finally comes _____ ",
    "I just need _____ to be happy",
    "I used to _____ until _____",
    "I used to have friends until _____",
    "If I could go back to highschool, I would _____",
    "If I could go back in time, I would _____",
    "What is one thing you would change about the world?",
    "What is your BIGGEST wish?",
    "What is a HUGE red flag?",
    "You're going on a first date. What do you do?",
    "What Youtube video title that would go viral?",
    "What can you not live without?",
    "It's EASY to make money, just _____",
    "Our school revealed a new mascot, the _____",
    "The president reavealed a new bill. The _____",
    "In 2021, the Try Guys try _____",
    "I identify as _____, so I don't have to _____",
    "_____? I am _____",
    "People _____, but _____",
    "Is it too much to ask for _____",
    "Science is _____",
    "Once we discover aliens _____",
    "In year 2050, _____",
    "Back in the 1700's _____",
    "Before Covid19 there was _____",
    "Life during World War II was _____",
    "My Grandfather was _____",
    "_____ like _____",
    "_____ but _____",
    "I would _____, however _____"
]


  
