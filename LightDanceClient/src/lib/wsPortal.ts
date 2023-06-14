import { useWSConvStore } from "../Stores/WSConnection";
import { MessageZod } from "../types/WSMsg";
import { handleWSMessage, parseWSError } from "./wsHandler";

let ws: WebSocket | null = null;
const { setConnected, logMessage, logPreConMessage, clearLogs } = useWSConvStore.getState();

let reconnectAttempts = 0;

function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    logPreConMessage("Attempting to connect");
    ws = new WebSocket("ws://localhost:45510");

    ws.onopen = () => {
        clearLogs("on connection");
        reconnectAttempts = 0;
        setConnected(true);
        sendWSMessage("initialize", "WJNRgVynX2FyUSfTskr4ihO5CNAx8wPOpmCy05Clgsk=");
    };

    ws.onmessage = (event) => {
        logMessage("rec", event.data);
        const objMessage = JSON.parse(event.data);
        const message = MessageZod.safeParse(objMessage);
        if (!message.success) {
            console.log(message.error);
            // sendWSMessage("throw", "An error happened while parsing the message.");
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

function sendWSMessage(type: string, message: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket is not open");
    }
    const sentMessage = JSON.stringify({
        source: "manager",
        type,
        payload: message,
    });
    logMessage("snd", sentMessage);
    ws.send(sentMessage);
}

export { connectWebSocket, sendWSMessage };
