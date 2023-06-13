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
let rpiInstances: Record<string, WebSocket> = {};
let espInstances: Record<string, WebSocket> = {};

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
    // const targetInstances = target == "rpi" ? rpiInstances : espInstances;
    const targets = ids ?? Object.keys(rpiInstances);
    console.log(rpiInstances);
    console.log(ids);
    console.log(targets);
    targets.forEach((id) => {
        rpiInstances[id].send(JSON.stringify(jsonMessage));
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

wss.on("connection", (ws: WebSocket) => {
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

                ws.send(JSON.stringify({ source: "bridger", type: "notify", payload: "Manager connected" }));
                managerInstance = ws;
                managerMsgQueue.forEach((msg) => {
                    managerInstance!.send(JSON.stringify(msg));
                });
                managerMsgQueue = [];
                return;
            } else if (!managerInstance)
                return sendBridgerError("Failed to establish manager status, please retry", undefined, ws);

            try {
                ExecuteManagerMessage(dataObject, sendBridgerMessage);
            } catch (e) {
                console.log(e);
                let err_message = "Unknown error";
                if (e instanceof Error) err_message = e.message;
                sendBridgerError(JSON.stringify(err_message), undefined, ws);
            }
            return;
        }

        console.log(dataObject);

        if (dataObject.type === "initialize") {
            const [apiKey, clientMacAddr] = dataObject.payload.split(";");
            if (apiKey !== process.env.CLIENT_API_KEY || !macAddrRegex.test(clientMacAddr)) {
                return sendBridgerError("Failed to establish client status, please retry", undefined, ws);
            }
            console.log(clientMacAddr);
            if (dataObject.source === "rpi") rpiInstances[clientMacAddr] = ws;
            else espInstances[clientMacAddr] = ws;

            return sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientMacAddr};status;connected;${dataObject.source};`,
            });
        }
        const clientAddr = Object.keys(rpiInstances).find((key) => rpiInstances[key] === ws);
        if (!clientAddr) return sendBridgerError("Failed to identify client, please retry", undefined, ws);

        try {
            ExecuteClientMessage(dataObject, sendBridgerMessage, clientAddr);
        } catch (e) {
            console.log(e);
            let err_message = "Unknown error";
            if (e instanceof Error) err_message = e.message;
            sendBridgerError(JSON.stringify(err_message), undefined, ws);
        }
    });

    ws.on("close", () => {
        console.log("Shit closed");
        if (managerInstance === ws) {
            managerInstance = null;
            sendBridgerMessage("rpi", null, {
                type: "notify",
                payload: "manager;status;disconnected",
            });
            sendBridgerMessage("esp", null, {
                type: "notify",
                payload: "manager;status;disconnected",
            });
        } else if (Object.values(rpiInstances).includes(ws)) {
            const clientAddr = Object.keys(rpiInstances).find((key) => rpiInstances[key] === ws);
            if (!clientAddr) return;
            delete rpiInstances[clientAddr];
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientAddr};status;disconnected`,
            });
        } else if (Object.values(espInstances).includes(ws)) {
            const clientAddr = Object.keys(espInstances).find((key) => espInstances[key] === ws);
            if (!clientAddr) return;
            delete espInstances[clientAddr];
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
