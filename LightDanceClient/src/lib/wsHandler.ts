import { showNotification } from "@mantine/notifications";
import { useBoardStore } from "../Stores/Boards";
import { useWSConvStore } from "../Stores/WSConnection";
import { BoardData } from "../types/Boards";
import { MessageType } from "../types/WSMsg";
import { useShowStore } from "../Stores/Show";

let boards: BoardData[] = [];
let showState: "initializing" | "running" | "complete" = "initializing";

useBoardStore.subscribe((state) => {
    boards = state.boards;
});

useShowStore.subscribe((state) => {
    showState = state.showState;
});

const { linkConnectedBoard, setBoardStatus, setBoardCalibrate } = useBoardStore.getState();
const { setRefreshedBoard } = useWSConvStore.getState();
const { setBoardState } = useShowStore.getState();

export function handleWSMessage(message: MessageType) {
    if (message.type === "notify") {
        const parsedPayload = message.payload.split(";");
        const clientAddr = parsedPayload[0];
        if (parsedPayload[1] == "status") {
            const status = parsedPayload[2];
            if (status === "connected") {
                if (boards.find((board) => board.id === clientAddr))
                    return linkConnectedBoard(clientAddr, parsedPayload[3]);
                else
                    showNotification({
                        title: "Unregistered Board Attempted To Connected",
                        message: `Board ${clientAddr} has attempted to connect`,
                        color: "orange",
                        autoClose: false,
                    });
            } else if (status === "processing") setBoardStatus(clientAddr, status);
            else if (status === "disconnected") {
                setBoardStatus(clientAddr, status);
                if (showState === "running")
                    showNotification({
                        title: "CRITICAL: Board Disconnected",
                        message: `Board ${clientAddr} has disconnected during show`,
                        color: "red",
                        autoClose: false,
                    });
            } else if (status === "done") setBoardStatus(clientAddr, "connected");
        } else if (parsedPayload[1] === "show") {
            if (parsedPayload[2] === "start") {
                setBoardState(clientAddr, "online");
            } else if (parsedPayload[2] === "complete") {
                setBoardState(clientAddr, "done");
            } else if (parsedPayload[2] === "terminated") {
                setBoardStatus(clientAddr, "connected");
            }
        } else if (parsedPayload[1] == "calibrate") {
            if (parsedPayload[2] === "processing") {
                setBoardCalibrate(clientAddr, "calibrating");
                setBoardStatus(clientAddr, "processing");
            } else if (parsedPayload[2] === "success") {
                showNotification({
                    title: `Delay check passed in Board ${clientAddr}`,
                    message: `Check passed with delay ${Math.ceil(parseFloat(parsedPayload[3]) * 100) / 100} ms`,
                    autoClose: 18000,
                });
            } else if (parsedPayload[2] === "done") {
                setBoardCalibrate(clientAddr, "calibrated");
                setBoardStatus(clientAddr, "connected");
            }
        } else if (parsedPayload[1] == "ethernet") {
            const clientName = boards.find((brd) => brd.id === clientAddr)?.name;
            if (!clientName)
                return showNotification({
                    title: "Error",
                    message: `Recieved ethernet update notification from unknown board ${clientAddr}`,
                    color: "red",
                });
            showNotification({
                title: `Ethernet Update for ${clientName}`,
                message: `Please ${parsedPayload[2]} ${clientName}'s ethernet`,
                autoClose: 18000,
            });
        } else if (parsedPayload[1] == "welcome") {
            showNotification({
                title: "Received WS Welcome Message",
                message: message.payload,
                color: "blue",
            });
        }
    } else if (message.type === "refresh") {
        const unauthed_boards: string[] = [];

        message.payload.split(";").forEach((board) => {
            const [mac_addr, ip] = board.split(",");
            console.log(mac_addr, ip);
            if (!mac_addr) return;
            console.log(mac_addr, ip);
            console.log(boards.find((b) => b.id === mac_addr));
            console.log(boards);
            if (!boards.find((b) => b.id === mac_addr)) return unauthed_boards.push(mac_addr);
            linkConnectedBoard(mac_addr, ip);
        });

        if (unauthed_boards.length)
            showNotification({
                title: "Unauthorized Boards in Refresh",
                message: `Boards ${unauthed_boards.join(" ")} found`,
                color: "orange",
            });
        setRefreshedBoard(true);
    } else if (message.type === "throw") {
        console.log(message.payload.split(";"));
        if (message.payload.split(";")[2] == "calibrate") {
            const boardId = message.payload.split(";")[0];
            setBoardStatus(boardId, "connected");
            setBoardCalibrate(boardId, "none");
            return showNotification({
                title: "Calibration Failed",
                message: `Board ${boardId} failed to calibrate due to ${message.payload.split(";")[3]}`,
                color: "red",
            });
        }
        const boardId = message.payload.split(";")[0];
        setBoardStatus(boardId, "connected");
        showNotification({
            title: "Received WS Throw Message",
            message: message.payload,
            color: "red",
        });
    }
}

export function parseWSError(event: CloseEvent) {
    let reason = "";
    if (event.code == 1000)
        reason =
            "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
    else if (event.code == 1001)
        reason =
            'An endpoint is "going away", such as a server going down or a browser having navigated away from a page.';
    else if (event.code == 1002) reason = "An endpoint is terminating the connection due to a protocol error";
    else if (event.code == 1003)
        reason =
            "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
    else if (event.code == 1004) reason = "Reserved. The specific meaning might be defined in the future.";
    else if (event.code == 1005) reason = "No status code was actually present.";
    else if (event.code == 1006)
        reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
    else if (event.code == 1007)
        reason =
            "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [https://www.rfc-editor.org/rfc/rfc3629] data within a text message).";
    else if (event.code == 1008)
        reason =
            'An endpoint is terminating the connection because it has received a message that "violates its policy". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.';
    else if (event.code == 1009)
        reason =
            "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
    else if (event.code == 1010)
        // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
        reason =
            "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " +
            event.reason;
    else if (event.code == 1011)
        reason =
            "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
    else if (event.code == 1015)
        reason =
            "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
    else reason = "Unknown reason";
    return reason;
}
