import { useState } from "react";
import Sidebar from "./Components/Nav/Sidebar";
import AsmApp from "./Components/Assembler/AsmApp";
import ConfApp from "./Components/Configurator/ConfApp";

function App() {
    const [appMode, setAppMode] = useState<"asm" | "conf">("asm");

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
