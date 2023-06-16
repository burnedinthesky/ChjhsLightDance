import { useWSConvStore } from "../Stores/WSConnection";
import { MessageZod } from "../types/WSMsg";
import { handleWSMessage, parseWSError } from "./wsHandler";

let ws: WebSocket | null = null;
const { setConnected, logMessage, logPreConMessage, clearLogs } = useWSConvStore.getState();

let reconnectAttempts = 0;

const server_addr = import.meta.env.VITE_SERVER_ADDR;
const manager_api_key = import.meta.env.VITE_MANAGER_API_KEY;

console.log(server_addr);

function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    logPreConMessage("Attempting to connect");
    ws = new WebSocket(`ws://${server_addr}`);

    ws.onopen = () => {
        clearLogs("on connection");
        reconnectAttempts = 0;
        setConnected(true);
        sendWSMessage("initialize", manager_api_key, "Initialized connection");
    };

    ws.onmessage = (event) => {
        logMessage("rec", event.data);
        const objMessage = JSON.parse(event.data);
        const message = MessageZod.safeParse(objMessage);
        if (!message.success) {
            console.log(message.error);
            logMessage("rec", `An error happened while parsing the message: ${message.error.message}`);
        }
        handleWSMessage(objMessage);
    };

    ws.onerror = (error) => {
        console.log(error);
    };

    ws.onclose = (e) => {
        setConnected(false);
        logPreConMessage(`Connection closed: ${parseWSError(e)}`);
        const timeout = 1000 * 2 ** Math.min(reconnectAttempts++, 7);
        logPreConMessage(`Reconnecting in ${timeout / 1000} seconds...`);
        setTimeout(connectWebSocket, timeout);
    };
}

function sendWSMessage(type: string, message: string, overwrite_log?: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket is not open");
    }
    const sentMessage = JSON.stringify({
        source: "manager",
        type,
        payload: message,
    });
    logMessage("snd", overwrite_log ?? sentMessage);
    ws.send(sentMessage);
}

export { connectWebSocket, sendWSMessage };
