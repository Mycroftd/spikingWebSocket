let teamName = "";
let username = "";
let otherPlayer = ""

async function startGame() {
  document.getElementById("startbutton").remove();
  let usernameInput = document.getElementById("userName");
  username = usernameInput.value;
  usernameInput.innerHTML = "";
  usernameInput.remove();
  document.getElementById("spanname").remove();

  const ws = await connectToServer();

  const messageBody = {username};
  ws.send(JSON.stringify(messageBody));
  document.getElementById("waitingMessage").innerText = "Waiting for another player...";

  ws.onmessage = (webSocketMessage) => {    
    const messageBody = JSON.parse(webSocketMessage.data);
    teamName = messageBody.teamName;
    otherPlayer = messageBody.otherPlayer;
    document.getElementById("players").innerText = username + " vs " + otherPlayer;
    document.getElementById("waitingMessage").innerText = "";
    playGame();
  };

  async function connectToServer() {
    const ws = new WebSocket(
      "ws://localhost:8080/unmatched?username=" + username
    );
    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        if (ws.readyState === 1) {
          clearInterval(timer);
          resolve(ws);
        }
      }, 10);
    });
  }
}

async function playGame() {
  const ws = await connectToServer();

  ws.onmessage = (webSocketMessage) => {
    const messageBody = JSON.parse(webSocketMessage.data);
    const cursor = getOrCreateCursorFor(messageBody);
    cursor.style.transform = `translate(${messageBody.x}px, ${messageBody.y}px)`; 
    console.log(messageBody.username, "who moved");
  };

  document.body.onmousemove = (evt) => {
    const messageBody = { x: evt.clientX, y: evt.clientY,username };
    ws.send(JSON.stringify(messageBody));
  };

  async function connectToServer() {
    console.log("Connecting to server");
    const ws = new WebSocket("ws://localhost:8080/matched?team=" + teamName);
    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        if (ws.readyState === 1) {
          clearInterval(timer);
          resolve(ws);
        }
      }, 10);
    });
  }

  function getOrCreateCursorFor(messageBody) {
    const sender = messageBody.sender;
    const existing = document.querySelector(`[data-sender='${sender}']`);
    if (existing) {
      return existing;
    }

    const template = document.getElementById("cursor");
    const cursor = template.content.firstElementChild.cloneNode(true);
    const svgPath = cursor.getElementsByTagName("path")[0];

    cursor.setAttribute("data-sender", sender);
    svgPath.setAttribute("fill", `hsl(${messageBody.color}, 50%, 50%)`);
    document.body.appendChild(cursor);

    return cursor;
  }
}
