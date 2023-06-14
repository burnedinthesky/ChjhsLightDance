import { z } from "zod";

export const MessageZod = z.object({
    source: z.enum(["manager", "bridger"]),
    type: z.string(),
    payload: z.string(),
});

export type MessageType = z.infer<typeof MessageZod>;
