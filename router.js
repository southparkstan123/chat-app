const express = require('express');
const app = express();
const http = require('http').Server(app);
const passport = require('passport');
const client = require('./database');

let chat_messages = [];
let chat_users = [];

module.exports = (express) => {
    const router = express.Router();

    let isLoggedIn = (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }else{
            res.redirect('/login');
        }
    }

    let isLoggedOut = (req, res, next) => {
        if (req.isAuthenticated()) {
            res.redirect('/');
        }else{
            return next();
        }
    }

    // The Authentication Route
    router.get('/auth/facebook', passport.authenticate('facebook',{ 
        scope: ['public_profile', 'manage_pages'] 
    }));

    // The Redirect URL route.
    router.get('/auth/facebook/callback', passport.authenticate('facebook',{ 
        failureRedirect:'/login'
    }),(req,res)=>{
        chat_users.push({
            id : req.user.profile.id,
            username : req.user.profile.displayName,
            lastLoggedIn : new Date().getTime()
        });
        client.set('chat_users', JSON.stringify(chat_users));
        res.redirect('/');
    });

    router.get('/', isLoggedIn, (req, res) => {
        res.cookie('expires', req.session.cookie._expires);
        res.sendFile(__dirname + '/index.html');
    });

    router.get('/login', isLoggedOut, (req, res) => {
        res.sendFile(__dirname + '/login.html');
    });

    // Logout url
    router.get('/logout', isLoggedIn ,(req,res)=>{
        req.logout();
        res.redirect("/login")
    });

    // API - Leave Chat
    router.post('/leave', isLoggedIn , function(req, res) {
        chat_users = chat_users.filter(user => user.id !== req.user.profile.id);
        client.set('chat_users', JSON.stringify(chat_users));
        res.send({
            'status': 'OK',
            'users':chat_users,
            'user':req.user.profile.displayName
        });
    });

    // API - Send + Store Message
    router.post('/send_message', isLoggedIn , function(req, res) {
        let messageObj = {
            'username': req.user.profile.displayName,
            'message': req.body.message,
            'date': new Date().getTime()
        };
        chat_messages.push(messageObj);
        client.set('chat_messages', JSON.stringify(chat_messages));

        res.send(messageObj);
    });

    // API - Get Messages
    router.get('/get_messages', isLoggedIn, function(req, res) {
        client.get('chat_messages', function(err, reply) {
            if (reply) {
                chat_messages = JSON.parse(reply);
                res.send(chat_messages);
            }
        });
    });

    // API - Get Chatters
    router.get('/get_users', isLoggedIn, function(req, res) {
        client.get('chat_users', function(err, reply) {
            if (reply) {
                chat_users = JSON.parse(reply);
                res.send({
                    "users":chat_users
                })
            }
        });
    });

    return router;
};