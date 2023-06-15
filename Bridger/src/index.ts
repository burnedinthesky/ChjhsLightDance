import * as http from "http";
import * as WebSocket from "ws";
import * as express from "express";
import dotenv from "dotenv";

import { ExecuteManagerMessage } from "./execute/manager";
import { ExecuteClientMessage } from "./execute/client";
import { BridgerMessageType, BoardTypes, MessageType, MessageZod, macAddrRegex } from "./messages.types";

dotenv.config();

const app_port = process.env.PORT || 8000;

const app = express.default();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let managerInstance: WebSocket | null = null;
let rpiInstances: Record<string, { ws: WebSocket; ip: string }> = {};

let managerMsgQueue: BridgerMessageType[] = [];

function sendBridgerMessage(target: BoardTypes, ids: string[] | null, message: BridgerMessageType) {
    const jsonMessage = {
        source: "bridger",
        ...message,
    };

    if (target == "manager") {
        if (managerInstance) managerInstance.send(JSON.stringify(jsonMessage));
        else managerMsgQueue.push(jsonMessage);
        return;
    }
    const targets = ids ?? Object.keys(rpiInstances);
    targets.forEach((id) => {
        rpiInstances[id].ws.send(JSON.stringify(jsonMessage));
    });
}

function sendBridgerError(
    error: string,
    registeredWs?: { target: BoardTypes; ids: string[] | null },
    rawWs?: WebSocket
) {
    if (registeredWs) {
        sendBridgerMessage(registeredWs.target, registeredWs.ids, {
            type: "throw",
            payload: error,
        });
    } else if (rawWs) {
        rawWs.send(
            JSON.stringify({
                source: "bridger",
                type: "throw",
                payload: error,
            })
        );
    } else throw new Error("No target specified");
}

wss.on("connection", (ws: WebSocket, req) => {
    console.log(`New connection from ${req.socket.remoteAddress}`);

    ws.on("message", (message: string) => {
        let dataObject: MessageType | null = null;

        try {
            const parsedMessage = JSON.parse(message);
            dataObject = MessageZod.parse(parsedMessage);
        } catch {
            sendBridgerError("An error happened while parsing the message.", undefined, ws);
        }

        if (!dataObject) return;

        if (dataObject.source === "manager") {
            if (dataObject.type === "initialize") {
                if (dataObject.payload !== process.env.MANAGER_API_KEY)
                    return sendBridgerError("Failed to establish manager status, please retry", undefined, ws);

                sendBridgerMessage("rpi", null, {
                    type: "notify",
                    payload: "manager;connected",
                });
                managerInstance = ws;
                managerMsgQueue.forEach((msg) => {
                    managerInstance!.send(JSON.stringify(msg));
                });
                managerMsgQueue = [];
                return;
            } else if (dataObject.type === "refresh") {
                if (dataObject.payload === "rpi") {
                    sendBridgerMessage("manager", null, {
                        type: "refresh",
                        payload: Object.keys(rpiInstances).reduce(
                            (acc, id) => acc + `${id},${rpiInstances[id].ip}`,
                            ""
                        ),
                    });
                } else {
                    sendBridgerError("Invalid refresh target", undefined, ws);
                }
                return;
            } else if (!managerInstance)
                return sendBridgerError("Failed to establish manager status, please retry", undefined, ws);

            try {
                ExecuteManagerMessage(dataObject, sendBridgerMessage);
            } catch (e) {
                let err_message = "Unknown error";
                if (e instanceof Error) err_message = e.message;
                sendBridgerError(JSON.stringify(err_message), undefined, ws);
            }
            return;
        }

        if (dataObject.type === "initialize") {
            const [apiKey, clientMacAddr, clientIp] = dataObject.payload.split(";");
            if (apiKey !== process.env.CLIENT_API_KEY || !macAddrRegex.test(clientMacAddr)) {
                return sendBridgerError("Failed to establish client status, please retry", undefined, ws);
            }

            if (dataObject.source === "rpi")
                rpiInstances[clientMacAddr] = {
                    ws,
                    ip: clientIp,
                };

            return sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientMacAddr};status;connected;${clientIp};`,
            });
        }
        const clientAddr = Object.keys(rpiInstances).find((key) => rpiInstances[key].ws === ws);
        if (!clientAddr) return sendBridgerError("Failed to identify client, please retry", undefined, ws);

        try {
            ExecuteClientMessage(dataObject, sendBridgerMessage, clientAddr);
        } catch (e) {
            let err_message = "Unknown error";
            if (e instanceof Error) err_message = e.message;
            sendBridgerError(JSON.stringify(err_message), undefined, ws);
        }
    });

    ws.on("close", () => {
        console.log(`Connection closed from ${req.socket.remoteAddress}`);
        if (managerInstance === ws) {
            managerInstance = null;
            sendBridgerMessage("rpi", null, {
                type: "notify",
                payload: "manager;disconnected",
            });
            sendBridgerMessage("esp", null, {
                type: "notify",
                payload: "manager;disconnected",
            });
        } else if (Object.values(rpiInstances).find((obj) => obj.ws === ws)) {
            const clientAddr = Object.keys(rpiInstances).find((key) => rpiInstances[key].ws === ws);
            if (!clientAddr) return;
            delete rpiInstances[clientAddr];
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientAddr};status;disconnected`,
            });
        }
    });
});

server.listen(app_port, () => {
    console.log(`Server started on port ${app_port}`);
});
