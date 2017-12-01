let $messageForm = $('#messageForm');
let $message = $('#message');
let $messageArea = $('#messageArea');

let $userForm = $('#userForm');
let $users = $('#users');
let $username = $('#username');
let $userFormArea = $('#userFormArea');

let $chat = $('#chat');
let socket = io();

let expire_time = new Date(getCookieExpiryTime()).getTime();

$(function(){
    axios.get('/get_users').then((response) =>{
        socket.emit('get_users', response.data);
        let user_count = response.data.users.length;
        $('.chat-info').html(`<h5>${user_count} user(s) in the chat room</h5>`);
    }).catch(err => console.log(err)); 

    axios.get('/get_messages').then((response) =>{
        socket.emit('get_messages', response.data);
    }).catch(err => console.log(err)); 
    
    $messageForm.submit((e) => {
        e.preventDefault();
        let data = {
            message : $.trim($message.val())
        }
        axios.post('/send_message', data).then((response) =>{
            socket.emit('message', response);
            $message.val('');
        });
    });

    $('#logout').click((e)=>{
        e.preventDefault();
        logout();
    })
});

socket.on('send', (data) => {
    let html = `<span class="message-time">${moment(data.date).format('LTS')}</span><div class="well"><strong>${data.username}</strong> : <p>${data.message}</p></div>`;
    $chat.append(html);
    $chat.animate({ scrollTop: $chat.prop("scrollHeight")}, 1000);
});

socket.on('update_users_list', (data) => {
    let html = '';
    data.forEach(user =>{
        html += `<li class="list-group-item">Username : ${user.username}<br> Login time : ${moment(user.lastLoggedIn).format('YYYY-MM-DD h:mm:ss A')}</li>`;
    })
    $('.chat-info').html(`<h5>${data.length} user(s) in the chat room</h5>`);
    $users.html(html);
});

socket.on('show_who_disconnect', (username) =>{
    let html = `<div class="well"><strong>${username}</strong> left</div>`;
    $chat.append(html);
    $chat.animate({ scrollTop: $chat.prop("scrollHeight")}, 1000);
});

socket.on('update_message_list', (data) => {
    let html = '';
    for(let i=0;i<data.length;i++){
        html += `<span class="message-time">${moment(data[i].date).format('LTS')}</span><div class="well"><strong>${data[i].username}</strong> : <p>${data[i].message}</p></div>`;
    }
    $chat.append(html);
});

function getCookieExpiryTime() {
    var name = "expires=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            let str = c.substring(name.length, c.length);
            return str.substring(3,str.length-1);
        }
    }
    return "";
}

function logout(){
    axios.post('/leave').then((response) =>{
        alert('Bye bye!!Please login again.');
        console.log(response.data.user);
        socket.emit('get_users', response.data);
        socket.emit('user_disconnect', response.data.user);
        window.location.href = '/logout';
    }).catch(err => console.log(err)); 
}

function stopToCheckCookie() {
    clearInterval(checkCookie);
}