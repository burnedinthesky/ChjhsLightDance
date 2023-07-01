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
export const LEDStripDataZod = z.object({
    id: z.string(),
    name: z.string(),
    assignedNum: z.number(),
    dma: z.string().nullable(),
    pin: z.string().nullable(),
    led_count: z.number().nullable(),
});

export type LEDStripData = z.infer<typeof LEDStripDataZod>;

export const LightGroupDataZod = z.object({
    id: z.string(),
    type: z.enum(["el", "ws"]),
    name: z.string(),
    assignedNum: z.number(),
    elConfig: z.array(z.string()).nullable(),
    wsConfig: z.object({
        id: z.string(),
        name: z.string(),
        assignedNum: z.number(),
        ledStrip: z.string().nullable(),
        ledPixels: z.array(z.tuple([z.number(), z.number()])),
    }),
});

export type LightingGroupData = z.infer<typeof LightGroupDataZod>;

export const BoardFlashData = z.object({
    type: z.enum(["esp", "rpi"]),
    boardNumber: z.number(),
    lsConfig: z.array(LEDStripDataZod),
    lgConfig: z.array(LightGroupDataZod),
    lightConfig: z.record(z.string(), z.array(z.record(z.string(), z.string()))),
});

export const FlashData = z.record(z.string(), BoardFlashData);

export const macAddrRegex = /^([0-9A-F]{2}){6}$/;
