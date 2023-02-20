let teamName = "";
let username = "";
let otherPlayer = "";
let startPos = [];
let enemyStartPos = [];
let currentPosX;
let currentPosY;
let otherPosX;
let otherPosY;
const speed = 10;
//ws://localhost:8080/unmatched?username="
const site = "ws://web-socket-dmcn.onrender.com";

async function startGame() {
  document.getElementById("startbutton").remove();
  let usernameInput = document.getElementById("userName");
  username = usernameInput.value;
  usernameInput.innerHTML = "";
  usernameInput.remove();
  document.getElementById("spanname").remove();

  const ws = await connectToServer();

  const messageBody = { username };
  ws.send(JSON.stringify(messageBody));
  document.getElementById("waitingMessage").innerText =
    "Waiting for another player...";

  ws.onmessage = (webSocketMessage) => {
    const messageBody = JSON.parse(webSocketMessage.data);
    teamName = messageBody.teamName;
    otherPlayer = messageBody.otherPlayer;
    startPos = messageBody.startPos;
    enemyStartPos = messageBody.enemyStartPos;
    console.log(enemyStartPos);

    document.getElementById("players").innerText =
      username + " vs " + otherPlayer;
    document.getElementById("waitingMessage").innerText = "";
    playGame();
  };

  async function connectToServer() {
    const ws = new WebSocket(
      site +  "/unmatched?username=" + username
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
  const ws = new WebSocket(site + "/matched?team=" + teamName);

  ws.onopen = function (e) {
    currentPosX = startPos[0];
    currentPosY = startPos[1];
    otherPosX = enemyStartPos[0];
    otherPosY = enemyStartPos[1];
    console.log();
    draw();
  };

  ws.onmessage = (webSocketMessage) => {
    const messageBody = JSON.parse(webSocketMessage.data);
    console.log(messageBody);
    if (messageBody.username === username) {
      currentPosX = messageBody.x;
      currentPosY = messageBody.y;
    } else {
      otherPosX = messageBody.x;
      otherPosY = messageBody.y;
    }
    draw();
    console.log(messageBody.username, "who moved");
  };

  document.body.onkeydown = (evt) => {
    console.log(evt.key);
    if (evt.key === "ArrowUp") {
      currentPosY -= speed;
    } else if (evt.key === "ArrowDown") {
      currentPosY += speed;
    } else if (evt.key === "ArrowLeft") {
      currentPosX -= speed;
    } else if (evt.key === "ArrowRight") {
      currentPosX += speed;
    }
    const messageBody = { x: currentPosX, y: currentPosY, username };
    ws.send(JSON.stringify(messageBody));
  };

  function draw() {
    const ctx = document.getElementById("canvas").getContext("2d");
    ctx.clearRect(0, 0, 600, 400); // clear canvas
    ctx.fillRect(currentPosX - 10, currentPosY + 10, 20, 20);
    ctx.fillRect(otherPosX - 10, otherPosY + 10, 20, 20);
  }
}
