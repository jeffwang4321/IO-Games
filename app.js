// http://localhost:8080/
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

    // End game page, reset game room variables
    socket.on('serverendgame1',function(){
        console.log("HITT serverendgame1");
        io.to(this.gameid).emit('game1over');
        for (i in roomtocolor[this.gameid]){
            colortopoints[roomtocolor[this.gameid][i]] = 0;
        }
        hit[this.gameid] = 0;
        ingame[this.gameid] = false;
        roomtocolor[this.gameid] = [];
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
    socket.on('scoregame2',function(color, msg){
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

        io.to(this.gameid).emit('addToChat', '*** ' + this.playername + ' chose "' + msg + '" ***', this.playercolor);
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
    // Cards agaist humanity prompts
    "As a teacher how do we get out students to succeed?", 
    "What's fun until it gets weird?",
    "Anthropologists have recently discovered a primitive tribe that worships _____",
    "Hey, baby, come back to my place and I'll show you _____",
    "Lovin' you is easy 'cause you're _____",
    "What's a girl's best friend?",
    "For my next trick, I will pull _____ out of _____",
    "When you get right down to it, _____ is just _____",
    "_____ is a slippery slope that leads to _____",
    "_____ : Hours of fun. Easy to use. Perfect for _____!",
    "My country, 'tis of thee, sweet land of _____",
    "In his farewell address, George Washington famously warned Americans about the dangers of _____",
    "Do you lack energy? Does it sometimes feel like the whole world is _____?",
    "Patients with _____ are likely a result of _____",
    "Well what do you have to say for yourself, Casey? This is the third time you've been sent to the principal's office for _____",
    "I'm not like the rest of you. I'm too rich and busy for _____",
    "This year's hottest album is _____ by _____",
    "This is the prime of my life. I'm young, hot, and full of _____",
    "What will I bring back in time to convince people that I am a powerful wizard?",
    "If you can't handle _____, you'd better stay away from _____",
    "I'm sorry sir, but we don't allow _____ at the country club.",
    "Here's what you can expect for the new year. Out with _____, in with _____",
    "Studies show that lab rats navigate mazes 50% faster after being exposed to _____",
    "_____  would be woefully incomplete without _____",
    "After months of practice with _____, I think I'm finally ready for _____",
    "In a pinch, _____ can be a suitable substitute for _____",
    "Having the worst day EVER. #_____",
    "In an attempt to reach a wider audience, the Museum of Natural History has opened an interactive exhibit on _____",
    "Everyone down on the ground! We don't want to hurt anyone. We're just here for _____",
    "TSA guidelines now prohibit _____ on airplanes.",
    "You left this stain on my couch, what is it?",
    "A romantic, candlelit dinner would be incomplete without _____",
    "What did the U.S. airdrop to the children of Afghanistan?",
    "While the United States raced the Soviet Union to the moon, the Mexican government funneled millions of pesos into research on _____",
    "Armani suit: $1,000. Dinner for two at that swanky restaurant: $300. The look on her face when you surprise her with _____ : priceless.",
    "In the seventh circle of Hell, sinners must endure _____ for all eternity.",
    "What helps the president unwind?",
    "During high school, I never really fit in until I found _____ club.",
    "Only two things in life are certain: death and _____",
    "2 AM in the city that never sleeps. The door swings open and she walks in. Something in her eyes tells me she's looking for _____",
    "Next season on Man vs. Wild, Bear Grylls must survive in the depths of the Amazon with only _____ and his wits.",
    "Charades was ruined for me forever when my mom had to act out _____",
    "Adventure. Romance. _____. From Paramount Pictures we present _____",
    "I spent my whole life working toward _____, only to have it ruined by _____.",
    "What ended my last relationship?",
    "After blacking out during New year's Eve, I was awoken by _____",
    "Before I run for president, I must destroy all evidence of my involvement with _____",
    "Members of New York's social elite are paying thousands of dollars just to experience _____",
    "What will always get you laid?",
    "I learned the hard way that you can't cheer up a grieving friend with _____",
    "I really hope my grandma doesn't ask me to explain _____ again.",
    "What are my parents hiding from me?",
    "Do not mess with me! I am literally _____ right now.",
    "Alright, boys. Our frat house is sad AF, and all the hot baddies are over at Kappa Sigma. The time has come to commence Operation _____",

    "Nothing turns me off more than _____",
    "I can't tell anyone I do _____, or else I will be incriminated.",
    "What's a headline that is sure to go viral?",
    "You catch your partner _____ your best friend... you _____",
    "What is the hardest thing about your life?",
    "What is 2 things that keep you going in this world?",
    "It is year 2050, we can now download our conscious into virtual reality. What is the first thing you do?",
    "Back in the 1700's our ancester used to _____ during their free time",
    "A criminal group hijacks the plane you're on... what do you do?",
    "Hackers reveal _____ in Elon Musk's search history.",
    // Feel free to add more
]


  
