import { z } from "zod";
import { BoardTypes, BridgerMessageType, FlashData, MessageType } from "../messages.types";

export const ExecuteManagerMessage = (
    message: MessageType,
    sendBridgerMessage: (target: BoardTypes, params: string[] | null, message: BridgerMessageType) => void
) => {
    if (message.type === "flash") {
        const objectData = JSON.parse(message.payload);
        const data = FlashData.parse(objectData);

        Object.keys(data).forEach((addr) => {
            sendBridgerMessage(data[addr].type, [addr], {
                type: "flash",
                payload: objectData[addr],
            });
        });
    } else if (message.type === "showStart") {
        const startTime = parseInt(message.payload);
        sendBridgerMessage("rpi", null, {
            type: "notify",
            payload: `show;start;${startTime}`,
        });
        sendBridgerMessage("esp", null, {
            type: "notify",
            payload: `show;start;${startTime}`,
        });
    } else if (message.type === "showStop") {
        sendBridgerMessage("rpi", null, {
            type: "notify",
            payload: `show;stop`,
        });
        sendBridgerMessage("esp", null, {
            type: "notify",
            payload: `show;stop`,
        });
    } else if (message.type === "throw") {
        console.log(`Manager thrown error: ${message.payload}`);
    } else throw new Error("Invalid message type.");
};
