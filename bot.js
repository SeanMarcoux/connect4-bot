const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');

var board;
var blank = "⚪";
var red = "🔴";
var black = "⚫";

var player1;
var player2;
var nextPlayer;

var useDMs = false;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("Connect 4");
    var channels = client.channels.array();
    for(var j = 0; j < channels.length; j++)
    {
        //if(channels[j].name.toLowerCase().includes("bot"))
        //    channels[j].send("Anyone up for a game of Connect 4?");
    }
    
    resetBoard();
});

client.on('message', msg => {
    if(msg.channel.name && !(msg.channel.name.toLowerCase().includes("bot")))
        return;
    if(msg.author.username == "connect4-bot")
        return;
    if(!msg.channel.name)
        console.log("Message received from " + msg.author.username + ": " + msg.content);
    
    var message = msg.content.toLowerCase();
    
    if(message === "connect4-bot, die")
    {
        setTimeout(function () {
            msg.reply("D:");
            setTimeout(function () {
                throw 'Goodbye cruel world';
            }, 1000);
        }, 1000);
    }
    
    reactToCommands(msg, message);
});

function reactToCommands(msg, message)
{
    if(!message.startsWith("?")) {
        return;
    }
    else if(message.startsWith("?help")) {
        help(msg);
    }
    else if(message.startsWith("?newgame ")) {
        useDMs = false;
        newPlayerGame(msg, message);
    }
    else if(message.startsWith("?newgamedm ")) {
        useDMs = true;
        newPlayerGame(msg, message);
    }
    else if(message.startsWith("?newgame")) {
        useDMs = false;
        player1 = msg.author.id;
        player2 = null;
        newGame(msg, msg.author.username, "the AI");
    }
    else if(message.startsWith("?play ")) {
        playMove(msg, message);
    }
    else {
        msg.reply("I didn't understand that command. If it was meant for another bot, my bad!");
    }
}

function help(msg) {
    msg.reply("The following commands are available:\n"
        + "*?help*: Displays this message\n"
        + "*?newgame (username)*: I'll start tracking a game of connect 4 between you and the person you named\n"
        + "*?newgamedm (username)*: Same as above, but it will work over DMs if you don't want to notify the whole channel\n"
        + "*?newgame*: I'll start a game of connect 4 with you!\n"
        + "*?play (1-7)*: You play a move in the column you chose");
}

function newPlayerGame(msg, message) {
    var p2 = getStringAfterSpace(message);
    var users = client.users.array();
    for(var i = 0; i < users.length; i++)
    {
        if(users[i].username.toLowerCase() === p2)
        {
            player2 = users[i].id;
            p2 = users[i].username;
            break;
        }
    }
    if(!player2) {
        msg.reply(p2 + " is not a user in this channel! Double check your spelling");
        return;
    }
    
    player1 = msg.author.id;
    nextPlayer = player1;
    if(useDMs) {
        dmUser(player2, "You have been challenged to a game of connect 4 by " + msg.author.username);
    }
    
    newGame(msg, msg.author.username, p2);
}

function newGame(msg, p1, p2) {
    msg.channel.send("New game started between " + p1 + " and " + p2 + "!");
    resetBoard();
    displayBoard(msg);
    nextPlayer = player1;
}

function resetBoard() {
    board = []
    for(var i = 0; i < 6; i++) {
        var row = [blank, blank, blank, blank, blank, blank, blank];
        board.push(row);
    }
}

function displayBoard(msg) {
    var boardMessage = "";
    for(var i = 0; i < board.length; i++) {
        for(var j = 0; j < board[i].length; j++) {
            boardMessage += board[i][j];
        }
        boardMessage += "\n";
    }
    if(useDMs)
    {
        dmUser(nextPlayer, boardMessage);
        dmUser(getNextPlayer(), boardMessage);
    }
    else
        msg.channel.send(boardMessage);
}

function getNextPlayer() {
    if(nextPlayer === player1)
        return player2;
    else
        return player1;
}

function dmUser(userId, message) {
    var user = client.users.find('id', userId.toString());//client.users[userId];
    console.log("Sending the following dm to " + user.username + ": " + message);
    user.createDM().then(function(dm) {
        dm.send(message);
    });
}

function playMove(msg, message) {
    if(msg.author.id !== player1 && msg.author.id !== player2) {
        msg.reply("You are not one of the active players!");
        return;
    }
    if(msg.author.id !== nextPlayer) {
        msg.reply("It is not your turn!");
        return;
    }
    var columnString = getStringAfterSpace(message);
    var column = parseInt(columnString);
    if(!(column >= 1 && column <= 7)) {
        msg.reply(columnString + " is an illegal move! Must be a number between 1 and 7.");
        return;
    }
    column--;
    var row = getAvailableRowInColumn(column)
    if(row == -1) {
        msg.reply((column+1) + " is already full! Pick an available column");
        return;
    }
    
    var color = getCurrentColor(msg.author.id);
    
    board[row][column] = color;
    
    if(detectWin(color)) {
        notifyWin(msg);
        resetBoard();
        return;
    }
    
    if(boardFull()) {
        displayBoard(msg);
        msg.channel.send("The board is full without a winner. Tie game!\nResetting the board now");
        resetBoard();
        return;
    }
    
    if(!player2) {
        playForAI(msg);
        return;
    }
    
    displayBoard(msg);
    setNextPlayer();
}

function notifyWin(msg) {
    displayBoard(msg);
    if(useDMs) {
        dmUser(nextPlayer, "You won! Congrats!\nResetting the board now.");
        dmUser(getNextPlayer(), "You lost!\nResetting the board now.");
    }
    else
        msg.reply("You won! Congrats!\nResetting the board now.");
}

function getStringAfterSpace(string) {
    if(string.indexOf(" ") > 0)
        return string.slice(string.indexOf(" ")+1, string.length);
    return null;
}

function getAvailableRowInColumn(column) {
    //If top row is full
    if(board[0][column] !== blank)
        return -1;
    
    for(var i = 1; i < 6; i++) {
        if(board[i][column] !== blank)
            return i-1;
    }
    return 5;
}

function getCurrentColor(playerId) {
    if(player1 === playerId)
        return red;
    return black;
}

function detectWin(color) {
    for(var row = 0; row < board.length; row++) {
        for(var column = 0; column < board[row].length; column++) {
            if(board[row][column] === color) {
                if(detectWinAroundPiece(color, row, column)) {
                    return true;
                }
            }
        }
    }
}

function detectWinAroundPiece(color, row, column) {
    if(row >= 3) {
        //Detect a win down a column
        if(board[row][column] === color && board[row-1][column] === color && board[row-2][column] === color && board[row-3][column] === color)
            return true;
        //Detect a win down a diagonal
        if(column >= 3) {
            if(board[row][column] === color && board[row-1][column-1] === color && board[row-2][column-2] === color && board[row-3][column-3] == color)
                return true;
        }
        //Detect win down other diagonal
        if(column <= 3) {
            if(board[row][column] === color && board[row-1][column+1] === color && board[row-2][column+2] === color && board[row-3][column+3] == color)
                return true;
        }
    }
    //Detect a win along a row
    if(column >=3) {
        if(board[row][column] === color && board[row][column-1] === color && board[row][column-2] === color && board[row][column-3] === color)
            return true;
    }
}

function boardFull() {
    for(var i = 0; i < board[0].length; i++) {
        if(board[0][i] === blank)
            return false;
    }
    return true;
}

function playForAI(msg) {
    playRandomMove(black);
    displayBoard(msg);
    
    if(detectWin(black)) {
        msg.reply("You lost!\nResetting the board now.");
        resetBoard();
        return;
    }
    
    if(boardFull()) {
        msg.channel.send("The board is full without a winner. Tie game!\nResetting the board now");
        resetBoard();
        return;
    }
}

function playRandomMove(color) {
    var possibleMoves = [];
    for(var i = 0; i < 7; i++) {
        if(getAvailableRowInColumn(i) > -1)
            possibleMoves.push(i);
    }
    
    var column = possibleMoves[getRandomInt(0, possibleMoves.length-1)];
    var row = getAvailableRowInColumn(column);
    board[row][column] = color;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setNextPlayer() {
    nextPlayer = getNextPlayer();
}

var key = fs.readFileSync("key.txt");
client.login(key.toString());