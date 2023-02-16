import { createServer } from "http";
import { parse } from "url";
import { WebSocketServer } from "ws";

const clients = new Map();

const server = createServer();
const wss1 = new WebSocketServer({ noServer: true });
const wss2 = new WebSocketServer({ noServer: true });

wss1.on("connection", function (ws) {
  const id = uuidv4();
  const color = Math.floor(Math.random() * 360);
  const room = ws.channel;
  const metadata = { id, color };

  clients.set(ws, metadata);

  ws.on("message", (messageAsString) => {
    const message = JSON.parse(messageAsString);
    const metadata = clients.get(ws);

    message.sender = metadata.id;
    message.color = metadata.color;

    [...clients.keys()].forEach((client) => {
      if (room === client.channel) client.send(JSON.stringify(message));
    });
  });
});

wss1.on("close", () => {
  clients.delete(ws);
});

let teamNo = 0;
let teamSize = 0;
let wsStore;
wss2.on("connection", function (ws) {
  ws.on("message", () => {
    if (teamSize === 0) {
      wsStore = ws;
      teamSize = 1;
    } else {
      const message = {
        teamName: teamNo,
      };
      teamNo++;
      teamSize = 0;
      wsStore.send(JSON.stringify(message));
      ws.send(JSON.stringify(message));
      wsStore.close();
      ws.close();
      wsStore = null;
    }
  });
});

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

server.on("upgrade", function upgrade(request, socket, head) {
  const { pathname } = parse(request.url);
  const newPath = pathname.slice(1);
  console.log(newPath);  
  const query = request.url.match(/=\w+/)[0].slice(1);
  console.log(query);

  if (newPath === "matched") {
    wss1.handleUpgrade(request, socket, head, function done(ws) {
      ws.channel = query;
      wss1.emit("connection", ws, request);
    });
  } else {
    wss2.handleUpgrade(request, socket, head, function done(ws) {
      ws.channel = query;
      wss2.emit("connection", ws, request);
    });
  }

});

server.listen(8080);
console.log("wss up");
