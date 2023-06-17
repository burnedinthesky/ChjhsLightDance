import { z } from "zod";
import { BoardTypes, BridgerMessageType, FlashData, MessageType } from "../messages.types";

export const ExecuteManagerMessage = (
    message: MessageType,
    sendBridgerMessage: (target: BoardTypes, params: string[] | null, message: BridgerMessageType) => void
) => {
    if (message.type === "flash") {
        const rawObjectData = JSON.parse(message.payload);
        const objData = FlashData.parse(rawObjectData);

        Object.keys(objData).forEach((addr) => {
            sendBridgerMessage(objData[addr].type, [addr], {
                type: "flash",
                payload: JSON.stringify(objData[addr]),
            });
        });
    } else if (message.type == "calibrate") {
        const boardId = message.payload;
        sendBridgerMessage("rpi", [boardId], {
            type: "calibrate",
            payload: "",
        });
    } else if (message.type === "showStart") {
        const startTime = parseInt(message.payload);
        sendBridgerMessage("rpi", null, {
            type: "notify",
            payload: `show;start;${startTime}`,
        });
    } else if (message.type === "showStop") {
        sendBridgerMessage("rpi", null, {
            type: "notify",
            payload: `show;stop`,
        });
    } else if (message.type === "throw") {
        console.log(`Manager thrown error: ${message.payload}`);
    } else throw new Error("Invalid message type.");
};
