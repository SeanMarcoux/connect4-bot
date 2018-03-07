const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');

var board;
var blank = "⚪";
var red = "🔴";
var black = "⚫";

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
    else if(message.startsWith("?newgame")) {
        newGame(msg);
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
        + "*?newGame*: I'll start a game of connect 4 with you!\n"
        + "*?play* (1-7): You play a move in the column you chose");
}

function newGame(msg) {
    msg.channel.send("New game started with " + msg.author + "!");
    resetBoard();
    displayBoard(msg);
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
    msg.channel.send(boardMessage);
}

function playMove(msg, message) {
    var columnString = getStringAfterSpace(message)
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
    board[row][column] = red;
    
    if(detectWin(red)) {
        displayBoard(msg);
        msg.reply("You won! Congrats!\nResetting the board now.");
        resetBoard();
        return;
    }
    
    if(boardFull()) {
        displayBoard(msg);
        msg.channel.send("The board is full without a winner. Tie game!\nResetting the board now");
        resetBoard();
        return;
    }
    
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

var key = fs.readFileSync("key.txt");
client.login(key.toString());