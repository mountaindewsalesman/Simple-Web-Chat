// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
      getDatabase,
      ref,
      get,
      child,
      set,
      push, 
      onChildAdded,
    } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserSessionPersistence, getIdToken } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyAPFdATsgDJkBZuyV9eXfFX_sxydV6noVM",
  authDomain: "simple-web-chat-b7d54.firebaseapp.com",
  projectId: "simple-web-chat-b7d54",
  storageBucket: "simple-web-chat-b7d54.firebasestorage.app",
  messagingSenderId: "1068369997075",
  appId: "1:1068369997075:web:304a059ad39db5a71a3ee6",
  measurementId: "G-56F8MB8QQB"
};

//database setup
const app = initializeApp(firebaseConfig);
const db = getDatabase(app, "https://simple-web-chat-b7d54-default-rtdb.firebaseio.com/")
const userDB = ref(db, "users");

//auth stuff
const auth = getAuth();

async function authSignUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // User created successfully
      console.log("auth signup success")
      return userCredential.user;
      
    })
    .catch((error) => {
      console.error(error.code, error.message);
      throw error;
    });
}

async function authLogin(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
            // Logged in
            console.log("auth login success")
      return userCredential.user;
      
    })
    .catch((error) => {
      console.error(error.code, error.message);
      throw error;
    });
}

async function authLogout() {
  return signOut(auth).catch((error) => {
    console.log("auth logout success")
    console.error(error);
  });
}



//user login stuff
let loggedIn = false
let curUserName = null
let curUserPass = null
let curUserEmail = null
let curUserChat = null
let curUserChatName = null
let numNotifs = 0

class User {
  constructor(name, email, pass) {
    this.name = name;
    this.email = email;
    this.hashedPass = sha256(pass);
    this.allowedChats = [{0: "global"}];

    var currentdate = new Date(); 
    this.timeCreated = 
      currentdate.getDate() + "/"
      + (currentdate.getMonth()+1)  + "/" 
      + currentdate.getFullYear() + " @ "  
      + currentdate.getHours() + ":"  
      + currentdate.getMinutes() + ":" 
      + currentdate.getSeconds();
  }
}

function sanitizeKey(key) {
  return key
    .toLowerCase()
    .replace(/\./g, '_dot_') 
    .replace(/#/g, '_hash_')
    .replace(/\$/g, '_dollar_')
    .replace(/\[/g, '_open_')
    .replace(/\]/g, '_close_')
    .replace(/@/g, '_at_');
}

async function userExists(userEmail) {
  const snapshot = await get(child(userDB, sanitizeKey(userEmail)));
  if (snapshot.exists()) {
    return(true);
  } else {
    return(false);
  }
}

//setup emailjs to email passwords
let emailjsOptions = {
  publicKey: 'V46cM1DTbUYQ3qnJH',
  // Do not allow headless browsers
  blockHeadless: true,
  blockList: {
    // Block the suspended emails
    list: [],
    // The variable contains the email address
    watchVariable: 'simplewebchat.swc@gmail.com',
  },
  limitRate: {
    // Set the limit rate for the application
    id: 'app',
    // Allow 1 request per 10s
    throttle: 5000,
  },
}
emailjs.init(emailjsOptions);


//sign up code
const signUp = document.getElementById("signUp");
signUp.addEventListener('click', addAccount)

async function addAccount(){
  let userName = prompt("Enter Name Here: (please enter your real name):");
  let userEmail = prompt("Enter Email Here:");
  userEmail = userEmail.toLowerCase();
  if(!userEmail.includes("@")){
    alert("Please enter a valid email adress!")
    return;
  }
  //check if user exists in database
  if(await userExists(userEmail)){
    alert("User email is already registered! Use 'Log In' to log in!");
  }else{
    //generate passcode
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = "1234567890"
    let passCodeResult = '';
    for (let i = 0; i < 3; i++) {
      passCodeResult += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 3; i++) {
      passCodeResult += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    let newUser = new User(userName, userEmail, passCodeResult);
    await set(child(userDB, sanitizeKey(userEmail)), newUser);

    //send the email
    let templateParams = {passcode: passCodeResult, email: userEmail};
    emailjs.send("service_1k01dze","template_g9vnbrg", templateParams, emailjsOptions);

    await authSignUp(userEmail, passCodeResult);

    alert("User has been created. Email containing passcode has been sent.");
  }
}
//log in code
const logIn = document.getElementById("logIn");
logIn.addEventListener('click', signIn)

async function signIn(){
  let userEmail = prompt("Enter Email Here:");



  userEmail = userEmail.toLowerCase();
  if(!userEmail.includes("@")){
    alert("Please enter a valid email adress!")
    return;
  }

  let userPass = prompt("Enter Passcode Here:");  

  if(await userExists(userEmail)){
    const snapshot = await get(child(userDB, sanitizeKey(userEmail)));
    let userData = snapshot.val();
    let hashedPass = sha256(userPass);
    if(hashedPass == userData.hashedPass){
      curUserName = userData.name;
      curUserPass = userPass;
      curUserEmail = userData.email;
      
      loggedIn = true;

      await authLogin(userEmail, userPass);
      await setPersistence(auth, browserSessionPersistence);

      if (auth.currentUser) {
        await getIdToken(auth.currentUser, true);
      }


      alert("Logged in!");
      refreshLoginView()
      updateSelectDropdown()
      refreshFileUploadStatus()
    }else{
      alert("Incorrect passcode.");
    }
  }else{
    alert("User is not yet registered! Use 'Sign Up' to sign up!")
  }
}

window.addEventListener("beforeunload", async () => {
  msgInput.value = ""
  if(curUserChat != null){
    const messageRef = child(msgDB,  curUserChat+"/messages")
    const newMessageRef = push(messageRef);
    await set(newMessageRef, new Message("cli", curUserName + " has left the chat.", "Client"));
  }
  await authLogout();
});



function refreshLoginView(){
  //loggedIn = true;
    document.getElementById('logged-in').style.display = loggedIn ? 'block' : 'none';
    document.getElementById('logged-in1').style.display = loggedIn ? 'block' : 'none';
    document.getElementById('logged-in2').style.display = loggedIn ? 'block' : 'none';
    document.getElementById('logged-out').style.display = loggedIn ? 'none' : 'block';
    document.getElementById('logged-out1').style.display = loggedIn ? 'none' : 'block';
    document.getElementById('logged-out2').style.display = loggedIn ? 'none' : 'block';
    if(loggedIn){
        document.getElementById('logged-in-as').textContent = "Logged in as " + curUserName + "!";
        document.getElementById('listInput').value = curUserEmail;
    }
}
refreshLoginView()


//handling of chats
const msgDB = ref(db, "chats");
class Message{
  constructor(type, content, author){
    this.type = type
    this.content = content
    this.time = Date.now()
    this.author = author
  }
}
class Chat{
  constructor(members, messageLimit){
    this.members = members
    this.messages = [new Message("cli", "New chat created containing users: "+ members.join(", ") + ".", "Client")]
    this.messageLimit = messageLimit
    this.allowedUsers = {};
    for(let i = 0; i < members.length; i++){
      //create permissions
      this.allowedUsers[sanitizeKey(members[i])] = true;
    }
  }
}

const selectChat = document.getElementById("selectChat");

let refreshChatList = document.getElementById("refreshChatList");
refreshChatList.addEventListener('click', updateSelectDropdown);

//make this a button called refresh. 

async function updateSelectDropdown(){
  const overlay = document.getElementById('loading-overlay');

  try{
    overlay.style.display = 'flex';


    while (selectChat.options.length > 1) {
      selectChat.remove(1); // always remove the second option until only one left
    }
    /*
    This code is shit
    const msgSnapshot = await get(msgDB);
    const userSnapshot = await get(userDB);
    let allUsers = userSnapshot.val();

    const chats = [];
    msgSnapshot.forEach(childSnap => {
      chats.push ({
        key: childSnap.key, 
        data: childSnap.val()
      })
    })
    
    for(let i = 0; i < chats.length; i++){
      let members = chats[i].data.members;
      
      if (members.includes(curUserEmail)){
        let names = []
        for(let j = 0; j < members.length; j++){
          names.push(allUsers[sanitizeKey(members[j])]["name"]);
        }
        
        selectChat.add(new Option(names.join(", "), chats[i].key)); 
      }
    }

    */
    const allowedChatsRef = child(userDB, sanitizeKey(curUserEmail)+"/allowedChats");
    const allowedChatsSnapshot = await get(allowedChatsRef);
    const allowedChats = allowedChatsSnapshot.val();

    const userSnapshot = await get(userDB);
    let allUsers = userSnapshot.val();

    for(const key in allowedChats){
      
      try{
        if(allowedChats[key] == "global"){
          selectChat.add(new Option("Global Chat", allowedChats[key])); 
        }else{
          let singleChat = await get(child(msgDB, allowedChats[key]))
          let members = singleChat.val().members;

          let names = []
          for(let j = 0; j < members.length; j++){
            names.push(allUsers[sanitizeKey(members[j])]["name"]);
          }
          
          const lastMsgSeen = singleChat.val().allowedUsers[sanitizeKey(curUserEmail)];
          let messages = singleChat.val().messages;
          let lastDBMsg = 0;
          for (const [key, msg] of Object.entries(messages)) {
            if(msg.time > lastDBMsg && msg.type != "cli"){
              lastDBMsg = msg.time;
            }
          }
          if(lastMsgSeen < lastDBMsg){
            let newOption = new Option("* " + names.join(", "), allowedChats[key]);
            newOption.style.color = "#FF0000";
            selectChat.add(newOption);
          }else{
            selectChat.add(new Option(names.join(", "), allowedChats[key])); 
          }
        }
      }catch(err){
        console.log("Chat " + allowedChats[key] + " no longer exists!");
        console.error(err);
      }
    }
    if(curUserChat != null){
      selectChat.value = curUserChat;
    }
  }
  finally{
    overlay.style.display = 'none';
  }
}

let messagesList = document.getElementById("messagesList");
let chatHeader = document.getElementById("chatHeader");

selectChat.addEventListener("change", changeCurUserChat)

async function changeCurUserChat(){
  const overlay = document.getElementById('loading-overlay');  

  try{
    
    overlay.style.display = 'flex';

    //before leave, send message that am leaving
    
    if(curUserChat != null){
      const messageRef = child(msgDB,  curUserChat+"/messages")
      const newMessageRef = push(messageRef);
      await set(newMessageRef, new Message("cli", curUserName + " has left the chat.", "Client"));
    }

    //change chat
    curUserChat = selectChat.value; 
    curUserChatName = selectChat.options[selectChat.selectedIndex].text;
  
    //send new message saying you entered
    const messageRef = child(msgDB,  curUserChat+"/messages")
    const newMessageRef = push(messageRef);
    await set(newMessageRef, new Message("cli", curUserName + " has joined the chat.", "Client"));
    
    await updateTextArea();
    autoUpdateText(); //set the path for event listener to be correct
  }finally{
    overlay.style.display = 'none';
  }
  updateSelectDropdown(); //which will dismiss the notif
}

const createChatButton = document.getElementById("createChat");
createChatButton.addEventListener('click', createChat)

async function createChat(){
  const listInput = document.getElementById('listInput').value;
  const emailList = listInput.split('\n').map(item => item.trim()).filter(Boolean);
  
  for(let i = 0; i < emailList.length; i++){
    emailList[i] = emailList[i].toLowerCase();
  }

  if(!emailList.includes(curUserEmail)){
    alert("Chat must contain your own email! You cannot creat a chat you aren't in!");
    return;
  }
  if(emailList.length < 2){
    alert("Chat must have at least two emails!");
    return;
  }
  for(let i = 0; i < emailList.length; i++){
    let email = emailList[i];
    if (!(await userExists(email))){
      alert("Unregistered or invalid email: " + email)
      return;
    }
  }
  emailList.sort()
  let chatKey = sanitizeKey(emailList.join(""))
  const snapshot = await get(child(msgDB, chatKey));
  if (snapshot.exists()) {
    alert("You cannot create a chat that already exists!")
    return;
  }

  let newChat = new Chat(emailList, 80) //80 messagwes
  await set(child(msgDB, chatKey), newChat);
  
  for(let i = 0; i < emailList.length; i++){
    const allowedChatsRef = child(userDB, sanitizeKey(emailList[i]) + "/allowedChats");
    await push(allowedChatsRef, chatKey);
  }
  alert("Chat has been created!")
  document.getElementById('listInput').value = curUserEmail;
}

//messages code

let scrollDown = document.getElementById("scrollDown");
scrollDown.checked = true;

async function updateTextArea(){
  //console.log("Updating text area...")

  if(curUserChat == null){
    messagesList.value = "";
    chatHeader.textContent = "<- Select a chat to start"
  }else{
    

    const chatRef = child(msgDB,  curUserChat);
    let chatVals = (await get(chatRef)).val();

    let constLastReadRef;
    let lastRead;
    if(curUserChat != "global"){
      constLastReadRef = child(chatRef, "allowedUsers/" + sanitizeKey(curUserEmail));
      lastRead = (await get(constLastReadRef)).val();
    }
    let newBestTime = false;

    // pass 1: find the last message index per chess gameId
    const lastEmbedMsg = {};
    let msgIdx = 0;
    Object.values(chatVals.messages).forEach(msg => {
      if (msg.type === "embed") {
        lastEmbedMsg[msg.content.gameId] = msgIdx;
      }
      msgIdx++;
    });
    
    msgIdx = 0;

    let outputString = "";
    Object.values(chatVals.messages).forEach(msg => {

      let newStr;

      if(msg.type == "text"){
        newStr = '<p id = "' + msg.time + '">' + msg.author + ": " + msg.content + "</p>"; 
      }
      else if(msg.type == "link"){
        newStr = '<p id = "' + msg.time + '">' + msg.author + ": " + '<a href = "' + msg.content + '" target="_blank">' + msg.content + "</a></p>";
      }else if(msg.type == "cli"){
          newStr = '<p id = "' + msg.time + '" style="color: #FF0000;">' + msg.author + ": " + msg.content + "</p>";
      }else if(msg.type == "jpeg"){
        newStr = '<p id = "' + msg.time + '"><img src = "' + msg.content + '"/></p>'; 
      }else if(msg.type == "embed"){
        if(msg.content.p1 != sanitizeKey(curUserEmail) && msg.content.p2 != sanitizeKey(curUserEmail)){
          newStr = '<p id = "' + msg.time + '" style="color: #0000ff;">' + msg.author + ": " + msg.content.type.toUpperCase() + " (You are not in this game!)" + "</a></p>";
        }else if (msgIdx != lastEmbedMsg[msg.content.gameId]){
          newStr = '<p id = "' + msg.time + '" style="color: #0000ff;">' + msg.author + ": " + msg.content.type.toUpperCase() + " with ID: " + msg.content.gameId + "</a></p>";
        }else{
          newStr = '<p id = "' + msg.time + '">' + msg.author + ': <br><iframe src="embeds/chess.html?p1=' + msg.content.p1 + '&p2=' + msg.content.p2 + '&turn=' + msg.content.turn + '&gameId=' + msg.content.gameId + '&curUser=' + sanitizeKey(curUserEmail) + '&gameData=' + msg.content.gameData + '&?v=0.1' + '" width="316" height="316"></iframe></p>';
        }
      }
      outputString += newStr;

      if(curUserChat != "global"){
        if(msg.type != "cli" && msg.time > lastRead){
          newBestTime = msg.time;
        }
      }
      msgIdx++;
    });
    if(newBestTime){
      await set(constLastReadRef, newBestTime);
    }
    messagesList.innerHTML = outputString;
    chatHeader.textContent = curUserChatName;
  }
  if(scrollDown.checked){messagesList.scrollTop = messagesList.scrollHeight;};
}

let currentMessagesUnsub = null; // store unsubscribe fn
function autoUpdateText() {
  //TS is CHATGPT test if it WORK to not give like 5 notifs at once on update
  //it seems to work but why does it take like 5 secs to update?
  if (currentMessagesUnsub) {
    currentMessagesUnsub();
    currentMessagesUnsub = null;
  }
  const messagesRef = child(msgDB, curUserChat + "/messages");

  currentMessagesUnsub = onChildAdded(messagesRef, (snapshot) => {
    updateTextArea();

    if (document.hidden) {
      numNotifs++;
    }
    setFaviconBadge(numNotifs);
  });
}


document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    numNotifs = 0;
    setFaviconBadge(numNotifs)
  } 
});

//SEND MSG STUFF

let sendMessage = document.getElementById("sendMessage");
sendMessage.addEventListener("click", addMessage)
let msgInput = document.getElementById("msgInput");

//classifying links
msgInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    addMessage()
  }
});

function isLink(str) {
  const urlPattern = /^(https?:\/\/[^\s/$.?#].[^\s]*)$/i;
  return urlPattern.test(str);
}


//file uploads

let uploadedImg = null;

function refreshFileUploadStatus(){
  const isFileUploaded = !(uploadedImg == null)
  document.getElementById('fileUploaded').style.display = isFileUploaded ? 'block' : 'none';
  document.getElementById('noFileUploaded').style.display = isFileUploaded ? 'none' : 'block';
}

let msgInputDiv = document.getElementById("msgInputDiv");

msgInputDiv.addEventListener('dragover', (e) => {
  e.preventDefault(); // allow drop
  msgInputDiv.style.borderColor = '#ff0000';
});

msgInputDiv.addEventListener('dragleave', () => {
  msgInputDiv.style.borderColor = '#000000';
});

msgInputDiv.addEventListener('drop', (e) => {
  e.preventDefault();
  msgInputDiv.style.borderColor = '#000000';

  uploadedImg = e.dataTransfer.files[0]; // take the first file
  refreshFileUploadStatus()
  console.log('Dropped file:', uploadedImg.name, uploadedImg.type, uploadedImg.size);

  if (!uploadedImg.type.startsWith('image/')) {
    alert('Only image files allowed!');
    uploadedImg = null;
    refreshFileUploadStatus()
    return;
  }
});

const uploadBtn = document.getElementById('uploadImg');
const fileInput = document.getElementById('fileInput');

uploadBtn.addEventListener('click', () => {
  fileInput.click(); // open file selector
});

fileInput.addEventListener('change', () => {
  

  uploadedImg = fileInput.files[0]; // get the selected file
  console.log('Selected file:', uploadedImg.name, uploadedImg.type, uploadedImg.size);
  refreshFileUploadStatus()

  if(!uploadedImg){
    uploadedImg = null;
    refreshFileUploadStatus()
    return;
  };

  if (!uploadedImg.type.startsWith('image/')) {
    alert('Only image files allowed!');
    uploadedImg = null;
    refreshFileUploadStatus()
    return;
  }
});

let cancelUploadBtn = document.getElementById("cancelImg");

cancelUploadBtn.addEventListener('click', () => {
  uploadedImg = null;
  refreshFileUploadStatus()
});

async function convertAndCompress(file) {
  const options = {
    maxSizeMB: 0.05,            // 50 KB target size
    maxWidthOrHeight: 1024,     // resize if needed
    useWebWorker: true,
    fileType: 'image/jpeg',      // force output type
  };

  let compressedFile = await imageCompression(file, options);

  // If still larger than 50 KB, iteratively reduce quality
  let quality = 1;
  while (compressedFile.size > 50 * 1024 && quality > 0.1) {
    options.initialQuality = quality;
    compressedFile = await imageCompression(file, options);
    quality -= 0.1;
  }

  return compressedFile;
}


async function addMessage(){
  if((msgInput.value != ""||uploadedImg != null) && curUserChat != null){

    const messageRef = child(msgDB,  curUserChat+"/messages")
    
    if(msgInput.value.charAt(0) == "/"){
      const commandList = msgInput.value.slice(1).trim().split(/\s+/);
      switch(commandList[0]){
        case "chat":

          switch(commandList[1]){
            case "clear":
              if(curUserChat == "global"){
                alert("You cannot clear the global chat!");
                msgInput.value = "";
                break;
              }
              if(window.confirm("Are you sure you want to clear all chat messages? This cannot be undone.")){
                await set(child(msgDB,  curUserChat+"/messages"), [new Message("cli", "Chat has been cleared by " + curUserName + ".", "Client")]);
                msgInput.value = "";
                updateTextArea();
              }
              break;
            case "save":
              let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(messagesList.innerHTML);
              let dlAnchorElem = document.createElement('a');
              dlAnchorElem.setAttribute("href",     dataStr     );
              let fileName = "chat-" + curUserChat + "-" + Date.now() + ".html"
              dlAnchorElem.setAttribute("download", fileName);
              dlAnchorElem.click();
              break;
            default:
              alert("Unknown subcommand: " + commandList[1]);
          }

          break;
        case "game":
          // /game chess randomemail@gmail.com
          const curUsers = await get(child(msgDB,  curUserChat+"/members"));

          if(curUserChat == "global"){
            alert("You cannot start a game in the global chat!");
          }

          if(!curUsers.val().includes(commandList[2])){
            alert("invalid email: " + commandList[2] + " is not in this chat!");
          }
        
          switch(commandList[1]){
            case "chess":
              const newMessageRef = push(messageRef);
              //sender is p2, receiver is p1
              await set(newMessageRef, new Message("embed", {type: "chess", p2: sanitizeKey(curUserEmail), p1: sanitizeKey(commandList[2]), turn: "p1", gameId: Date.now(), gameData: false}, curUserName));
              

            break;
          default:
              alert("Invalid game: " + commandList[1]);
          }

          break;
        default:
          alert("Unknown command: " + commandList[0]);
      }

      msgInput.value = "";
      return;
    }

    if(msgInput.value != ""){
      let sentMsg = msgInput.value;
      if(sentMsg.length > 500){
        alert("You have exceeded the 500 character message limit. Please Shorten.");
        return;
      }
      const newMessageRef = push(messageRef);

      let msgType = "text"
      if(isLink(sentMsg)){
        msgType = "link"
      }
      console.log("msgType: " + msgType);

      await set(newMessageRef, new Message(msgType, sentMsg, curUserName));
    }
    if(uploadedImg != null){
      if(msgInput.value == ""){
        //send just the name of the author
        const newMessageRef = push(messageRef);
        await set(newMessageRef, new Message("text", "", curUserName));
      }

      uploadedImg = await convertAndCompress(uploadedImg)

      const reader = new FileReader();
      const base64String = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(uploadedImg);
      });

      const newMessageRef = push(messageRef);
      await set(newMessageRef, new Message("jpeg", base64String, curUserName));


      uploadedImg = null;
      refreshFileUploadStatus();

    }
    msgInput.value = "";
  }
}

window.addEventListener('embedReply', async (event) => {
  const messageRef = child(msgDB,  curUserChat+"/messages")
  const newMessageRef = push(messageRef);
  await set(newMessageRef, new Message("embed", event.detail, curUserName));
});

async function pruneOldMessages() {
  if(curUserChat != null){
    const chatSnapshot = await get(child(msgDB, curUserChat));
    let curList = chatSnapshot.val();

    const limit = curList.messageLimit
    let messagesObj = curList.messages;

    const messages = Object.keys(messagesObj).map(key => {
      return {
        id: key,
        ...messagesObj[key]
      }
    });
    // If messages length exceeds limit, prune oldest
    if (messages.length > limit) {
      // Sort messages by time ascending (oldest first)
      messages.sort((a, b) => a.time - b.time);
      

      // Keep only the newest `limit` messages
      const pruned = messages.slice(messages.length - limit);

      // Write back pruned messages
      const messagesRef = child(msgDB,  curUserChat+"/messages")
      await set(messagesRef, pruned);
    }
  }

}
setInterval(pruneOldMessages, 10000);

//UI stuff
document.addEventListener("DOMContentLoaded", function() {
  const toggle = document.getElementById("darkToggle");

  toggle.addEventListener("change", function() {
    document.body.classList.toggle("dark", toggle.checked);
    localStorage.setItem('darkMode', toggle.checked ? 'dark' : 'light');

  });
});

function autoUpdateUImode(){
  const UImode = localStorage.getItem('darkMode');
  if(UImode){
    document.body.classList.toggle("dark", UImode == 'dark');
    const toggle = document.getElementById("darkToggle");
    toggle.checked = UImode == 'dark';
  }
}
autoUpdateUImode();