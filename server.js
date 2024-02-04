import {createRequire} from "module";
import GameServer from "./src/GameServer.js";

const require = createRequire(import.meta.url);
const https = require("https");

const { Server } = require("socket.io");

const port = 3000;

const requestListener = function (req, res) {
    res.writeHead(200);
};

const server = https.createServer(requestListener);
const io = new Server(server, { cors: { origin: '*' } });

server.listen(port,() => {
    console.log(`Server is running on :${port}`);
});

let Game = new GameServer(io)
Game.init()
Game.start()