import {createRequire} from "module";
import GameServer from "./src/GameServer.js";

const require = createRequire(import.meta.url);
const http = require("http");
const fs = require('fs')

const { Server } = require("socket.io");

const host = '178.19.246.11';
const port = 9001;

const requestListener = function (req, res) {
    res.writeHead(200);
};

const server = http.createServer(requestListener);
const io = new Server(server, { cors: { origin: '*' } });

server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

let Game = new GameServer(io)
Game.init()
Game.start()