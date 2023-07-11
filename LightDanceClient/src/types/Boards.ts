import { z } from "zod";

export const BoardStatusZod = z.enum(["disconnected", "connected", "processing", "inshow"]);

export type BoardStatus = z.infer<typeof BoardStatusZod>;

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

export const BoardDataZod = z.object({
    id: z.string(),
    name: z.string(),
    status: BoardStatusZod,
    ip: z.string().nullable(),
    assignedNum: z.number(),
    ledStrips: z.array(LEDStripDataZod),
    lightGroups: z.array(LightGroupDataZod),
    calibrationStat: z.enum(["none", "calibrating", "calibrated"]),
});

export type BoardData = z.infer<typeof BoardDataZod>;
