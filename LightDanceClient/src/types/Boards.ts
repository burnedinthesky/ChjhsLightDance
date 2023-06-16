import { z } from "zod";

export const BoardStatusZod = z.enum(["disconnected", "connected", "processing", "inshow"]);

export type BoardStatus = z.infer<typeof BoardStatusZod>;

export const LightGroupDataZod = z.object({
    id: z.string(),
    name: z.string(),
    assignedNum: z.number(),
    lights: z.array(z.string()),
});

export type LightingGroupData = z.infer<typeof LightGroupDataZod>;

export const BoardDataZod = z.object({
    id: z.string(),
    name: z.string(),
    status: BoardStatusZod,
    ip: z.string(),
    assignedNum: z.number(),
    lightGroups: z.array(LightGroupDataZod),
    calibrated: z.boolean(),
});

export type BoardData = z.infer<typeof BoardDataZod>;
