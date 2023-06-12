import { z } from "zod";

// ClientMessageTypes: "initialize", "recieve", "reply", "throw"

// MangagerMessageTypes: "initialize", "flash"

export type BoardTypes = "manager" | "rpi" | "esp";

export const MessageZod = z.object({
    source: z.enum(["manager", "rpi", "esp"]),
    type: z.string(),
    payload: z.string(),
});

export type MessageType = z.infer<typeof MessageZod>;

export const BridgerMessageZod = z.object({
    type: z.string(),
    payload: z.string(),
});

export type BridgerMessageType = z.infer<typeof BridgerMessageZod>;

export const BoardFlashData = z.object({
    type: z.enum(["esp", "rpi"]),
    lgConfig: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            assignedNum: z.number(),
            lights: z.array(z.string()),
        })
    ),
    lightConfig: z.record(z.string(), z.array(z.record(z.string(), z.string()))),
});

export const FlashData = z.record(z.string(), BoardFlashData);

export const macAddrRegex = /^([0-9A-F]{2}){6}$/;
