# IO-Games

- Browser based IO Games using Node.js and socket.io packets 
- Mimic a client server environment using web sockets 
- Client connections organized into unique rooms and can run independently
- Hosted example: https://io-games-jeff-wang.herokuapp.com/

## Features

Chat Features:
- Users can join different rooms by each entering a player name and game id
- Users can assigned a unique identification color
- Users can send messages to other users in the room
- A notification is sent when a user joins or leaves the room
- Chatroom tracks the number of connected users, player name & color 
- Users can toggle chat display to show or hide chat

Game Features:
- Score tracking displays in real-time
- Room connection for current room is disabled while game is in session
- Room state & display automatically reset at the end of each round 
- User disconnection, empty room state and multi-round edge cases tested 
- Blank tiles change to user color on click (Spam Colors)
- Interactive answer prompts display after user input (Party Blanks)

## How to PLay

Spam Colors:
- Click the blank tiles to get +1 point
- Game end when all 100 tiles have been clicked
- Click the most tiles to win!
![](public/img/game1.png)

Party Blanks:
- Each player takes turns reading the prompt
- Remaining players have 1 chance to answer the prompt
- Once remaining players have answered, highlight the answer bubbles to read
- Prompt reader then checks their favourite answer for +1 point!
- Option to skip bad prompts or end the game
![](public/img/game2.png)

## How to use

```
$ npm ci
$ npm start
```
Local testing:
- Point your browser tabs to http://localhost:8080

Multiplayer testing:
- Forward port 8080 via router settings
- Point to public IPv4 Address http://ipaddress:8080 


