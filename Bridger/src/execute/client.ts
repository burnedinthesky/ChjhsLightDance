import { BridgerMessageType, BoardTypes, MessageType } from "../messages.types";

export const ExecuteClientMessage = (
    message: MessageType,
    sendBridgerMessage: (target: BoardTypes, params: string[] | null, message: BridgerMessageType) => void,
    clientId: string
) => {
    if (message.type === "recieve") {
        if (message.payload === "flash") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};status;processing`,
            });
        } else if (message.payload === "showStart") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};show;start`,
            });
        } else if (message.payload === "showComplete") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};show;complete`,
            });
        } else if (message.payload === "showTerminate") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};show;terminated`,
            });
        } else if (message.payload === "managerConnected") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};welcome`,
            });
        } else if (message.payload === "calibrate") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};calibrate;processing`,
            });
        }
    } else if (message.type === "reply") {
        const parsedPayload = message.payload.split(";");
        if (parsedPayload[0] === "flash") {
            sendBridgerMessage("manager", null, {
                type: "notify",
                payload: `${clientId};status;done`,
            });
        } else if (parsedPayload[0] === "calibrate") {
            if (parsedPayload[1] == "delay") {
                let delay_time = parseFloat(parsedPayload[2]);
                let cur_time = new Date();
                let target_time = new Date(cur_time.getTime() + 3000);
                let new_date = `${target_time.getFullYear()}-${target_time.getMonth() + 1}-${target_time.getDate()}`;
                let new_time = `${target_time.getHours()}:${target_time.getMinutes()}:${target_time.getSeconds()}`;
                while (true) {
                    let current_time = new Date();
                    if (target_time.getMilliseconds() - current_time.getMilliseconds() <= delay_time + 10) break;
                }
                console.log(`Payload: ${new_date} ${new_time}`);
                sendBridgerMessage("rpi", [clientId], {
                    type: "calibrate",
                    payload: `${new_date} ${new_time}`,
                });
            } else if (parsedPayload[1] == "complete") {
                sendBridgerMessage("manager", null, {
                    type: "notify",
                    payload: `${clientId};calibrate;done`,
                });
            }
        }
    } else if (message.type == "notify") {
        const parsedPayload = message.payload.split(";");
        if (parsedPayload[0] == "calibrate") {
            if (parsedPayload[1] == "ethernet") {
                sendBridgerMessage("manager", null, {
                    type: "notify",
                    payload: `${clientId};ethernet;${parsedPayload[2]}`,
                });
            } else if (parsedPayload[1] == "stageComplete") {
                if (parsedPayload[2] == "1")
                    setTimeout(
                        () =>
                            sendBridgerMessage("rpi", [clientId], {
                                type: "calibrate",
                                payload: "",
                            }),
                        5000
                    );
            }
        }
    } else if (message.type === "throw") {
        sendBridgerMessage("manager", null, {
            type: "throw",
            payload: `${clientId};error;${message.payload}`,
        });
    }
};
