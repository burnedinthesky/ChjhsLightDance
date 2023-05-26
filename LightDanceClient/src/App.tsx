import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import Sidebar from "./Components/Nav/Sidebar";
import AsmApp from "./Components/Assembler/AsmApp";
import ConfApp from "./Components/Configurator/ConfApp";

function App() {
    const [greetMsg, setGreetMsg] = useState("");
    const [name, setName] = useState("");

    const [appMode, setAppMode] = useState<"asm" | "conf">("conf");

    async function greet() {
        // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
        setGreetMsg(await invoke("greet", { name }));
    }

    return (
        <div className="fixed inset-0 flex bg-zinc-100">
            <div className="w-16 h-screen">
                <Sidebar setAppMode={setAppMode} />
            </div>
            <div className="h-screen flex-grow">{appMode === "asm" ? <AsmApp /> : <ConfApp />}</div>
        </div>
    );
}

export default App;
