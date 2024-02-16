// Constants to easily refer to pages
const SPLASH = document.querySelector(".splash");
const PROFILE = document.querySelector(".profile");
const LOGIN = document.querySelector(".login");
const ROOM = document.querySelector(".room");

// Custom validation on the password reset fields
const passwordField = document.querySelector(".profile input[name=password]");
const repeatPasswordField = document.querySelector(".profile input[name=repeatPassword]");
const repeatPasswordMatches = () => {
  const p = document.querySelector(".profile input[name=password]").value;
  const r = repeatPassword.value;
  return p == r;
};
const checkPasswordRepeat = () => {
  const passwordField = document.querySelector(".profile input[name=password]");
  if(passwordField.value == repeatPasswordField.value) {
    repeatPasswordField.setCustomValidity("");
    return;
  } else {
    repeatPasswordField.setCustomValidity("Password doesn't match");
  }
}

passwordField.addEventListener("input", checkPasswordRepeat);
repeatPasswordField.addEventListener("input", checkPasswordRepeat);

function show_page(page) {
    console.log(console.log('show'.concat(' ', page)));
    document.getElementById(page).style.display = "";
}
function hide_page(page) {
    console.log(console.log('hide'.concat(' ', page)));
    document.getElementById(page).style.display = "none";
}

// splash container
function getRoomList() {
    fetch(`/api/get_roomlist`, {
        method: 'GET',
        headers: {
            //'x-api-key': WATCH_PARTY_API_KEY,
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .then(rooms => {
            displayRooms(rooms);
        })
        .catch(error => console.error('Error:', error));
}
function displayRooms(rooms) {
    const messagesContainer = document.querySelector('.roomList');
    messagesContainer.innerHTML = '';
    if (typeof rooms === 'string' || rooms instanceof String) {
        show_page('noRooms')
    } else {
        hide_page('noRooms');
        rooms.forEach(room => {
            const messageElement = document.createElement('a');
            messageElement.setAttribute('href', `/room/${room.id}`)
            messageElement.innerHTML = `${room.id}: <strong>${room.name}</strong>`;
            messagesContainer.appendChild(messageElement);
        })
    }
}
function newRoom() {
    fetch(`/api/new_room`, {
        method: 'GET',
        headers: {
            'x-api-key': WATCH_PARTY_API_KEY,
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(result => {
        window.location.href = `/room/${result.id}`;
    })
    .catch(error => console.error('Error:', error));
}
window.addEventListener('load', function() {
    if ((new URL(window.location.href).pathname.split('/')[1]).localeCompare('') == 0) {
        show_page('SC');
        getRoomList();
    } else {
        hide_page('SC');
    }
});
document.querySelector("#to_signup").addEventListener('click', (e) => {
    window.location.href = '/login';
});
document.querySelector("#createroom_button").addEventListener('click', (e) => {
    newRoom();
});


// profile
function updateID(name_or_password) {
    var route;
    if (name_or_password.localeCompare('name') == 0) {
        route = `/api/user/name`;
    } else {
        route = `api/user/password`;
    }
    const messageData = {username: document.getElementById('username_field').value,
                         password: document.getElementById('password_field').value};
    fetch(route, {
        method: 'POST',
        headers: {
            'x-api-key': WATCH_PARTY_API_KEY,
            "Content-Type": "application/json"
          },
        body: JSON.stringify(messageData)
    })

    .then(response => response.json())
    .catch(error => {
        console.error(error);
    });
}
function logout() {
    fetch(`/api/logout`, {
        method: 'GET',
        headers: {
            'x-api-key': WATCH_PARTY_API_KEY,
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(result => {
        location.reload();
    })
    .catch(error => {
        console.error(error);
    });
}
window.addEventListener('load', function() {
    if ((new URL(window.location.href).pathname.split('/')[1]).localeCompare('profile') == 0) {
        show_page('profile');

        // update username and password
        document.querySelector("#username_button").addEventListener('click', (e) => {
            e.preventDefault();
            updateID('name');
        });
        document.querySelector("#password_button").addEventListener('click', (e) => {
            e.preventDefault();
            password = document.getElementById('password_field').value;
            repeat = document.getElementById('repeatPassword_field').value;
            if (password == repeat) {
                console.log('password updated');
                updateID('password');
            }
        });
    } else {
        hide_page('profile');
    }
});
document.querySelector("#goToSplash_button").addEventListener('click', (e) => {
    window.location.href = '/';
});
document.querySelector("#logout_button").addEventListener('click', (e) => {
    logout();
});


// login & signup
function prompt_login() {
    const messageData = {username: document.getElementById('login_username').value,
                         password: document.getElementById('login_password').value};
    fetch('/api/login', {
        method: 'POST',
        headers: {
            //'x-api-key': WATCH_PARTY_API_KEY,
            "Content-Type": "application/json"
          },
        body: JSON.stringify(messageData)
    })
    .then(response => response.json())
    .then(result => {
        if (result == 'User not identified') {
            show_page('login_error');
        } else {
            hide_page('login_error');
            window.location.href = result.redirectUrl;
        }
    })
    .catch(error => {
        console.error(error);
    });
}
function create_user() {
    fetch('/api/signup', {
        method: 'GET',
        headers: {
            //'x-api-key': WATCH_PARTY_API_KEY,
            "Content-Type": "application/json"
          }
    })
    .then(response => response.json())
    .then(result => {
        //console.log(result.redirectUrl);
        window.location.href = result.redirectUrl;
    })
    .catch(error => {
        console.error(error);
    });
}
window.addEventListener('load', function() {
    if ((new URL(window.location.href).pathname.split('/')[1]).localeCompare('login') == 0) {
        show_page('login');
        hide_page('login_error');
    } else {
        hide_page('login');
    }
});
document.querySelector("#login_button").addEventListener('click', (e) => {
    prompt_login();
});
document.querySelector("#signup_button").addEventListener('click', (e) => {
    create_user();
});


// room
function getRoomName() {
    const roomId = new URL(window.location.href).pathname.split('/')[2];
    fetch(`/api/get_room_name/rooms/${roomId}`, {
        method: 'GET',
        headers: {
            'x-api-key': WATCH_PARTY_API_KEY,
            "Content-Type": "application/json"
        },
    })
      .then(response => response.json())
      .then(name => {
        const messagesContainer = document.querySelector('.roomName');
        messagesContainer.innerHTML = `${name.roomName}`;
      })
      .catch(error => console.error('Error:', error));
}
function getMessages() {
    const roomId = new URL(window.location.href).pathname.split('/')[2];
    fetch(`/api/get_messages/rooms/${roomId}`, {
        method: 'GET',
        headers: {
            'x-api-key': WATCH_PARTY_API_KEY,
            "Content-Type": "application/json"
        },
    })
      .then(response => response.json())
      .then(messages => {
        displayMessages(messages);
      })
      .catch(error => console.error('Error:', error));
}
function displayMessages(messages) {
    const messagesContainer = document.querySelector('.messages');
    messagesContainer.innerHTML = '';
    if (typeof messages === 'string' || messages instanceof String) {
        const messageElement = document.createElement('message');
        messageElement.innerHTML = `<span>${messages}</span>`;
        messagesContainer.appendChild(messageElement);
    } else {
        messages.forEach(message => {
            const messageElement = document.createElement('message');
            messageElement.innerHTML = `
                <author>${message.author}</author>
                <content>${message.body}</content>
            `;
            messagesContainer.appendChild(messageElement);
        });
    }
}
function updateRoomName() {
    const roomId = new URL(window.location.href).pathname.split('/')[2];
    const new_name = document.querySelector('#input_field').value;
    const messageData = {name: new_name};
    fetch(`/api/update_roomname/${roomId}`, {
        method: 'POST',
        headers: {
            'x-api-key': WATCH_PARTY_API_KEY,
            "Content-Type": "application/json"
          },
        body: JSON.stringify(messageData)
    })
    .then(response =>  response.json())
    .then(data => {
      document.querySelector('.roomName').innerHTML = new_name;
    })
    .catch(error => {
        console.error(error);
    });
}
function postMessage() {
    const roomId = new URL(window.location.href).pathname.split('/')[2];
    const msg = document.getElementById('comment_content').value;
    const messageData = { room_id: roomId, comment: msg };
    
    fetch(`/api/post_message/rooms/${roomId}`, {
        method: 'POST',
        headers: {
            'x-api-key': WATCH_PARTY_API_KEY,
            "Content-Type": "application/json"
          },
        body: JSON.stringify(messageData)
    })
    .then(response =>  response.json())
    .then(_ => {
        document.getElementById('comment_content').value = '';
    })
    .catch(error => {
      console.error('Error posting message:', error);
    });
}
window.addEventListener('load', function() {
    if ((new URL(window.location.href).pathname.split('/')[1]).localeCompare('room') == 0) {
        show_page('room');
        getRoomName();
        getMessages();
    } else {
        hide_page('room');
    }
});
// poll messages
if ((new URL(window.location.href).pathname.split('/')[1]).localeCompare('room') == 0) {
    setInterval(getMessages, 500);
}
// process user clicks edit
document.querySelector("#edit_button").addEventListener('click', (e) => {
    const e1 = document.querySelector('.displayRoomName');
    e1.setAttribute('class', 'displayRoomName hide');
    const e2 = document.querySelector('.editRoomName.hide');
    e2.setAttribute('class', 'editRoomName');
});
// proces user clicks save
document.querySelector("#display_button").addEventListener('click', (e) => {
    const e1 = document.querySelector('.displayRoomName.hide');
    e1.setAttribute('class', 'displayRoomName');
    const e2 = document.querySelector('.editRoomName');
    e2.setAttribute('class', 'editRoomName hide');
    updateRoomName();
});
// post message
if ((new URL(window.location.href).pathname.split('/')[1]).localeCompare('room') == 0){
    document.querySelector("#post_button").addEventListener('click', (e) => {
        //e.preventDefault();
        //console.log('postMessage');
        postMessage();
    });
}
