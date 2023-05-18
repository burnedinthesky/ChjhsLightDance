import { rawApp as app } from "./app";
import { LGSchema, boardConfig } from "../data/boardConfig";
import { authenticate } from "../lib/expressLib";

import bodyParser from "body-parser";

app.use(bodyParser.json());

app.get("/board/config", authenticate, (req, res) => {
    const configs = boardConfig.getConfigs();
    res.json(configs);
});

app.get("/board/config/:id", authenticate, (req, res) => {
    const { id } = req.params;
    const configs = boardConfig.getConfigs();
    if (!configs[id]) return res.status(404).json({ error: "Config not found" });
    res.json(configs[id]);
});

app.post("/board/config", authenticate, (req, res) => {
    const reqBody = req.body;
    const { mac_addr, name } = reqBody;
    if (!mac_addr) return res.status(400).json({ error: "mac_addr is required" });
    let config;
    try {
        config = boardConfig.createConfig(mac_addr, name);
    } catch (e: any) {
        console.log(e);
        return res.status(409).json({ error: e.message });
    }
    res.json(config);
});

app.put("/board/config/:id", authenticate, (req, res) => {
    const { id } = req.params;
    const { name, groups } = req.body;
    if (!id) return res.status(400).json({ error: "Board id is required" });
    if (groups && !LGSchema.safeParse(groups).success)
        return res.status(400).json({ error: "Invalid LightingGroup configuration" });
    const updatedConf = boardConfig.setConfig(id, { name, groups });
    res.json(updatedConf);
});

app.delete("/board/config/:id", authenticate, (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Board id is required" });
    boardConfig.deteleConfig(id);
    res.status(204).send();
});

export { app };
