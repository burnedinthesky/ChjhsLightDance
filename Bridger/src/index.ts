import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

import { app } from "./routes/router";
import { boardConfig } from "./data/boardConfig";

const app_port = process.env.PORT || 8999;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let wsInstance: WebSocket | null = null;

wss.on("connection", (ws: WebSocket) => {
    wsInstance = ws;

    ws.on("message", (message: string) => {
        console.log("received: %s", message);
        ws.send(`Hello, you sent -> ${message}`);
    });

    ws.send("Hi there, I am a WebSocket server");
});

function sendWSMessage(message: string) {
    if (!wsInstance) throw new Error("WebSocket instance not initialized!");
    wsInstance.send(message);
}

server.listen(app_port, () => {
    console.log(`Server started on port ${app_port}`);
});
