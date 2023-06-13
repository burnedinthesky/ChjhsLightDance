import * as WebSocket from "ws";
import { BoardTypes, BridgerMessageType, FlashData, MessageType } from "../messages.types";
import { z } from "zod";

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
    } else if (message.type === "calibrate") {
        const [target, addr, time] = message.payload.split(";");
        const callibrateZod = z.object({
            target: z.enum(["esp", "rpi"]),
            addr: z.string(),
            time: z.number(),
        });

        const parsedData = callibrateZod.parse({
            target,
            addr,
            time: parseFloat(time),
        });

        sendBridgerMessage(parsedData.target, [parsedData.addr], {
            type: "notify",
            payload: `callibrate;${parsedData.time}`,
        });
    } else if (message.type === "showStart") {
        const systemTime = parseFloat(message.payload);
        sendBridgerMessage("rpi", null, {
            type: "notify",
            payload: `show;start;${systemTime}`,
        });
        sendBridgerMessage("esp", null, {
            type: "notify",
            payload: `show;start;${systemTime}`,
        });
    } else if (message.type === "showTerminate") {
        sendBridgerMessage("rpi", null, {
            type: "notify",
            payload: `show;terminate`,
        });
        sendBridgerMessage("esp", null, {
            type: "notify",
            payload: `show;terminate`,
        });
    } else throw new Error("Invalid message type.");
};
