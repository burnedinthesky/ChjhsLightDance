import * as WebSocket from "ws";
import { BridgerMessageType, BoardTypes, MessageType } from "../messages.types";

export const ExecuteClientMessage = (
    message: MessageType,
    sendBridgerMessage: (target: BoardTypes, params: [] | null, message: BridgerMessageType) => void,
    clientId: string
) => {
    if (message.type === "recieve") {
        if (message.payload === "flash") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};status;processing`,
            });
        } else if (message.payload === "terminate") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};show;terminated`,
            });
        } else if (message.payload === "showStart") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};show;start`,
            });
        }
    } else if (message.type === "reply") {
        if (message.payload === "callibrate") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};callibrate;${message.payload}`,
            });
        } else if (message.payload === "flash") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};status;done`,
            });
        }
    } else if (message.type === "throw") {
        sendBridgerMessage("manager", null, {
            type: "throw",
            payload: `${clientId};error;${message.payload}`,
        });
    }
};
