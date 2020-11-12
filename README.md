# IO-Games

- Browser based IO Games using Node.js and socket.io packets 
- Mimic a client server environment using web sockets 
- Client conenctions orgainzed into unique rooms and can run independently
- Hosted example: https://chat-rooms-jeffwang.herokuapp.com/

## Features

Chat Features:
- Users can join different rooms by each entering a player name and game id
- Users can assigned a unique identification color
- Users can send messages to other users in the room
- A notification is sent when a user joins or leaves the room
- Chatroom tracks the number of connected user, player name & color 

Game Features:
- Blank tiles change to user color on click
- Score tracking displays in real-time
- Room connection for current room is disabled while game is in session
- Room state & game displays automatically resets at the end of round 
- User disconnection, empty room state and multi-round edge cases tested 

## How to use

```
$ npm ci
$ npm start
```

Point your browser to http://localhost:8080


