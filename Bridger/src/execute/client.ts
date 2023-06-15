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
        } else if (message.payload === "showStart") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};show;start`,
            });
        } else if (message.payload === "showComplete") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};show;complete`,
            });
        } else if (message.payload === "showTerminate") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};show;terminated`,
            });
        } else if (message.payload === "managerConnected") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};welcome`,
            });
        }
    } else if (message.type === "reply") {
        if (message.payload === "flash") {
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
