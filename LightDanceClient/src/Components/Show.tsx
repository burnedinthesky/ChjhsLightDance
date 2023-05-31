import { Button, Modal, Popover } from "@mantine/core";
import { useBoardStore } from "../Stores/Boards";
import { notifications, showNotification } from "@mantine/notifications";
import { useEffect, useRef, useState } from "react";

import { BaseDirectory, readBinaryFile } from "@tauri-apps/api/fs";

interface ShowDisplayProps {
    showId: string | null;
    setShowId: React.Dispatch<React.SetStateAction<string | null>>;
}

const recieveStartTime = (startTime: Date) => {
    const now = new Date();
    return new Date(now.getTime() + 10000);
};

const loadAudio = (audioFile: string) => {
    return readBinaryFile(audioFile, { dir: BaseDirectory.AppData }).then((file) =>
        URL.createObjectURL(new Blob([file], { type: "audio/mpeg" }))
    );
};

const ShowDisplay = ({ showId, setShowId }: ShowDisplayProps) => {
    const { boards, audioFile } = useBoardStore((state) => ({ boards: state.boards, audioFile: state.audioFile }));

    const [showInitialized, setShowInitialized] = useState<boolean>(false);
    const [timeUntilStart, setTimeUntilStart] = useState<number | null>(null);
    const [boardReady, setBoardReady] = useState<
        Record<
            string,
            {
                name: string;
                ready: boolean;
            }
        >
    >({});
    const [showCompleted, setShowComplete] = useState<boolean>(false);

    const startTime = useRef<Date | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        notifications.clean();
        boards.forEach((board) => {
            setBoardReady((cur) => ({
                ...cur,
                [board.id]: {
                    name: board.name,
                    ready: false,
                },
            }));
            setTimeout(() => {
                setBoardReady((cur) => ({
                    ...cur,
                    [board.id]: {
                        name: board.name,
                        ready: true,
                    },
                }));
            }, Math.floor(Math.random() * 7000) + 1000);
        });

        loadAudio(audioFile!).then((src) => {
            if (audioRef.current === null) throw new Error("Audio ref is null");
            audioRef.current!.src = src;
            setShowInitialized(true);
        });

        startTime.current = recieveStartTime(new Date());
    }, []);

    useEffect(() => {
        if (!showInitialized) return;
        const interval = setInterval(() => {
            if (!startTime.current) return;
            const now = new Date();
            setTimeUntilStart(startTime.current.getTime() - now.getTime());
            if (startTime.current.getTime() - now.getTime() < 0) {
                setTimeUntilStart(0);
                return;
            }
        }, 100);
        return () => clearInterval(interval);
    }, [showInitialized]);

    useEffect(() => {
        if (!showInitialized || timeUntilStart !== 0) return;
        if (audioRef.current === null) throw new Error("Audio ref is null");

        console.log(timeUntilStart);
        Object.values(boardReady).forEach((board) => {
            if (board.ready) return;
            showNotification({
                title: "Show start aborted",
                message: `Board ${board.name} is not ready!`,
                color: "red",
                autoClose: false,
            });
            setShowId(null);
        });
        audioRef.current.play();
    }, [showInitialized, timeUntilStart]);

    return (
        <Modal
            opened={true}
            onClose={() => {
                if (showCompleted) setShowId(null);
                else
                    showNotification({
                        message: "Show is in progress, terminate the show to close modal!",
                        autoClose: 10000,
                    });
            }}
            classNames={{ title: "font-semibold font-jbmono", content: "px-4" }}
            size="lg"
            title="Chingshin Light Dance Manager - Running Show"
        >
            <div className="w-full font-jbmono">
                <h3 className="">Show ID: {showId!}</h3>
                <div className="w-full flex flex-col gap-4">
                    {showInitialized ? (
                        <>
                            <p>
                                {showCompleted
                                    ? "Show completed"
                                    : timeUntilStart !== null
                                    ? `Time until show start: ${timeUntilStart} msecs`
                                    : "Show in progress"}
                            </p>
                            <div className="mt-3 grid grid-cols-2 border border-slate-400 divide-x divide-y divide-slate-400">
                                {Object.values(boardReady).map((board) => (
                                    <div className="p-2">
                                        <p>
                                            {board.name}:{" "}
                                            {board.ready ? "Ready" : <span className="text-red-500">Pending conf</span>}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="mt-4">Pending show initialization...</p>
                    )}
                </div>
            </div>
            <audio
                className={`w-full mt-4`}
                ref={audioRef}
                controls={showInitialized}
                onEnded={() => {
                    setShowComplete(true);
                }}
            />
            <div className="w-full flex justify-end gap-4 mt-4">
                {showCompleted ? (
                    <Button
                        className=" font-jbmono bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                        size="xs"
                        onClick={() => {
                            setShowId(null);
                        }}
                    >
                        Close
                    </Button>
                ) : (
                    <Popover
                        width={300}
                        position="bottom"
                        withArrow
                        shadow="md"
                        classNames={{ dropdown: "font-jbmono text-sm" }}
                    >
                        <Popover.Target>
                            <Button
                                className=" font-jbmono bg-red-500 hover:bg-red-600 transition-colors duration-100"
                                size="xs"
                            >
                                Terminate
                            </Button>
                        </Popover.Target>
                        <Popover.Dropdown>
                            <p>Are you sure you want to terminate the show?</p>

                            <div className="mt-3 w-full flex justify-end">
                                <Button
                                    className=" font-jbmono bg-red-500 hover:bg-red-600 transition-colors duration-100"
                                    size="xs"
                                    onClick={() => {
                                        showNotification({
                                            message: "Show terminated by user",
                                            color: "red",
                                        });
                                        setShowId(null);
                                    }}
                                >
                                    Terminate
                                </Button>
                            </div>
                        </Popover.Dropdown>
                    </Popover>
                )}
            </div>
        </Modal>
    );
};

export default ShowDisplay;
