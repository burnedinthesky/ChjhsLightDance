import { z } from "zod";
import { BoardTypes, BridgerMessageType, FlashData, MessageType } from "../messages.types";

export const ExecuteManagerMessage = (
    message: MessageType,
    sendBridgerMessage: (target: BoardTypes, params: string[] | null, message: BridgerMessageType) => void
) => {
    if (message.type === "flash") {
        const rawObjectData = JSON.parse(message.payload);
        let objData = FlashData.parse(rawObjectData);

        Object.keys(objData).forEach((addr) => {
            sendBridgerMessage(objData[addr].type, [addr], {
                type: "flash",
                payload: JSON.stringify({
                    ...objData[addr],
                    lgConfig: objData[addr].lgConfig.map((lg) => ({
                        ...lg,
                        elConfig: lg.elConfig === null ? "None" : lg.elConfig,
                        wsConfig: lg.wsConfig === null ? "None" : lg.wsConfig,
                    })),
                }),
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
