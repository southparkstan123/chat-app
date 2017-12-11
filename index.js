const express = require('express');
const app = express();
const session = require('express-session');
const setupPassport = require('./passport');
const bodyParser = require('body-parser');
const router = require('./router')(express);
const port = process.env.PORT || 8080;
const client = require('./database');
const http = require('http').Server(app);
const cookieParser = require('cookie-parser');
const io = require('socket.io')(http);

client.once('ready', function() {
    // Flush Redis DB
    client.flushdb();

    // Initialize Chatters
    client.get('chat_users', function(err, reply) {
        if (reply) {
            chat_users = JSON.parse(reply);
        }
    });

    // Initialize Messages
    client.get('chat_messages', function(err, reply) {
        if (reply) {
            chat_messages = JSON.parse(reply);
        }
    });

});

client.on('connect', function(){
    console.log("Connect to Redis...");
});

client.on('error', function(err){
    console.log(err);
});

app.use(session({
    secret: 'supersecret',
    saveUninitialized: true,
    resave: false,
    cookie: { 
        maxAge: null
    }
}));

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cookieParser());
setupPassport(app);

app.use('/', router);

io.on('connection', (socket) => {

    socket.on('user_disconnect', (user) => {
        console.log(user + ' offline');
        io.emit('show_who_disconnect',user);
    });

    socket.on('get_users', (data) => {
        console.log(data);
        data.users.forEach(user => {
            console.log(user.username + ' online');
        });
        io.emit('update_users_list', data.users);
    });

    socket.on('message', (messageObj) => {
        console.log(messageObj.data);
        io.emit('send', messageObj.data);
    });

    socket.on('get_messages', (data) => {
        io.emit('update_message_list', data);
    });


});

http.listen(port);
console.log('listening on port ', port);