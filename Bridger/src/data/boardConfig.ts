import fs from "fs";
import path from "path";
import { cloneDeep } from "lodash";
import { z } from "zod";

const LGSchema = z.array(z.object({ id: z.string(), pins: z.array(z.string()) }));

type BoardConfig = {
    id: string;
    name: string;
    groups: z.infer<typeof LGSchema>;
};

type OptBoardConfig = {
    name?: string;
    groups?: z.infer<typeof LGSchema>;
};

const jsonFilePath = path.join(__dirname, "../..", "data", "board_config.json");

class BoardConfigurator {
    #configs: Record<string, BoardConfig> = {};
    initialized: boolean = false;

    constructor() {
        if (!fs.existsSync(jsonFilePath)) fs.writeFileSync(jsonFilePath, "{}", "utf-8");

        const data = fs.readFileSync(jsonFilePath, "utf-8");
        const jsonData = JSON.parse(data);

        this.#configs = cloneDeep(jsonData);
        this.initialized = true;

        console.log("BoardConfigurator initialized!");
    }

    getConfigs() {
        return this.#configs;
    }

    createConfig(mac_addr: string, name?: string) {
        if (mac_addr in this.#configs) throw new Error("Config already exists!");
        const newConfig: BoardConfig = {
            id: mac_addr,
            name: name || `Board ${Object.keys(this.#configs).length + 1}`,
            groups: [],
        };
        return this.setConfig(mac_addr, newConfig);
    }

    setConfig(id: string, config: OptBoardConfig) {
        const currentConfig = this.#configs[id];

        console.log(config);

        this.#configs[id] = {
            id: currentConfig.id,
            name: config.name || currentConfig.name,
            groups: config.groups || currentConfig.groups,
        };

        console.log(this.#configs[id]);

        fs.writeFileSync(jsonFilePath, JSON.stringify(this.#configs, null, 2), "utf-8");
        return this.#configs[id];
    }

    deteleConfig(id: string) {
        delete this.#configs[id];
        fs.writeFileSync(jsonFilePath, JSON.stringify(this.#configs, null, 2), "utf-8");
    }
}

const boardConfig = new BoardConfigurator();

export { BoardConfigurator, boardConfig, LGSchema };
