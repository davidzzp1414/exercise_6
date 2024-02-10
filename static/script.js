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

let CURRENT_ROOM = 0;

passwordField.addEventListener("input", checkPasswordRepeat);
repeatPasswordField.addEventListener("input", checkPasswordRepeat);


// TODO:  On page load, read the path and whether the user has valid credentials:
//        - If they ask for the splash page ("/"), display it
//        - If they ask for the login page ("/login") and don't have credentials, display it
//        - If they ask for the login page ("/login") and have credentials, send them to "/"
//        - If they ask for any other valid page ("/profile" or "/room") and do have credentials,
//          show it to them
//        - If they ask for any other valid page ("/profile" or "/room") and don't have
//          credentials, send them to "/login", but remember where they were trying to go. If they
//          login successfully, send them to their original destination
//        - Hide all other pages

// TODO:  When displaying a page, update the DOM to show the appropriate content for any element
//        that currently contains a {{ }} placeholder. You do not have to parse variable names out
//        of the curly  braces—they are for illustration only. You can just replace the contents
//        of the parent element (and in fact can remove the {{}} from index.html if you want).

// TODO:  Handle clicks on the UI elements.
//        - Send API requests with fetch where appropriate.
//        - Parse the results and update the page.
//        - When the user goes to a new "page" ("/", "/login", "/profile", or "/room"), push it to
//          History

// TODO:  When a user enters a room, start a process that queries for new chat messages every 0.1
//        seconds. When the user leaves the room, cancel that process.
//        (Hint: https://developer.mozilla.org/en-US/docs/Web/API/setInterval#return_value)

// On page load, show the appropriate page and hide the others

let showOnly = (element) => {
  CURRENT_ROOM = 0;

  SPLASH.classList.add("hide")
  PROFILE.classList.add("hide");
  LOGIN.classList.add("hide");
  ROOM.classList.add("hide");

  element.classList.remove("hide");
}

// Show me a new "page"
let router = () => {
  let path = window.location.pathname;


  if(path == "/") {
    showOnly(SPLASH);

  }
  else if(path == "/profile"){
    showOnly(PROFILE);
  }
  else if(path.startsWith("/room/")) {
    showOnly(ROOM);

    // get the room id
    CURRENT_ROOM = 4;

    // ...
  }
  else if(path == "/login") {
    showOnly(LOGIN);
  } 
  else {
    // show a 404?
    console.log("I don't know how we got to "+pathname+", but something has gone wrong");
  }
  // ..
}

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("popstate", router);


setInterval(500, () => {
  // If we're not in a room, don't query for messages
  if (CURRENT_ROOM == 0) return;

  fetch("/api/messages/room/"+CURRENT_ROOM)
});