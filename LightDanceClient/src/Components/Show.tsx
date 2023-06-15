import { Button, Modal, Popover } from "@mantine/core";
import { useBoardStore } from "../Stores/Boards";
import { notifications, showNotification } from "@mantine/notifications";
import { useEffect, useRef, useState } from "react";

import { BaseDirectory, readBinaryFile } from "@tauri-apps/api/fs";
import { useShowStore } from "../Stores/Show";
import { sendWSMessage } from "../lib/wsPortal";

interface ShowDisplayProps {
    showId: string | null;
    setShowId: React.Dispatch<React.SetStateAction<string | null>>;
}

const setStartTime = () => {
    const now = new Date();
    return new Date(now.getTime() + 1000);
};

const loadAudio = async (audioFile: string) => {
    return readBinaryFile(audioFile, { dir: BaseDirectory.AppData }).then((file) =>
        URL.createObjectURL(new Blob([file], { type: "audio/mpeg" }))
    );
};

const ShowDisplay = ({ showId, setShowId }: ShowDisplayProps) => {
    const { boards, audioFile } = useBoardStore((state) => ({ boards: state.boards, audioFile: state.audioFile }));

    const [timeUntilStart, setTimeUntilStart] = useState<number | null>(null);

    const { boardState, showState, initializeShow, completeShow } = useShowStore((state) => ({
        boardState: state.boardState,
        showState: state.showState,
        initializeShow: state.initializeShow,
        completeShow: state.completeShow,
    }));

    const startTime = useRef<Date | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        notifications.clean();

        loadAudio(audioFile!).then((src) => {
            if (audioRef.current === null) throw new Error("Audio ref is null");
            audioRef.current!.src = src;
            const startTimeDate = setStartTime();
            initializeShow(
                boards.map((board) => ({ id: board.id, name: board.name })),
                startTimeDate.getTime()
            );
            startTime.current = startTimeDate;
        });
    }, []);

    useEffect(() => {
        if (showState === "initializing") return;
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
    }, [showState]);

    useEffect(() => {
        if (showState !== "running" || timeUntilStart !== 0) return;
        if (audioRef.current === null) throw new Error("Audio ref is null");

        Object.values(boardState).forEach((board) => {
            if (board.ready === "pending") {
                showNotification({
                    title: "Show start aborted",
                    message: `Board ${board.name} is not ready!`,
                    color: "red",
                    autoClose: false,
                });
                setShowId(null);
            }
        });
        audioRef.current.play();
    }, [showState, timeUntilStart]);

    return (
        <Modal
            opened={true}
            onClose={() => {
                if (showState === "complete") setShowId(null);
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
                    {showState !== "initializing" ? (
                        <>
                            <p>
                                {showState === "complete"
                                    ? "Show completed"
                                    : timeUntilStart !== null
                                    ? `Time until show start: ${timeUntilStart} msecs`
                                    : "Show in progress"}
                            </p>
                            <div className="mt-3 grid grid-cols-2 border border-slate-400 divide-x divide-y divide-slate-400">
                                {Object.values(boardState).map((board) => (
                                    <div className="p-2">
                                        <p>
                                            {board.name}:{" "}
                                            {board.ready === "done" ? (
                                                <span className="text-green-500">Queue empty</span>
                                            ) : board.ready === "online" ? (
                                                <span className="text-blue-500">Ready</span>
                                            ) : (
                                                <span className="text-red-500">Pending conf</span>
                                            )}
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
                controls={showState !== "initializing"}
                onEnded={() => {
                    completeShow();
                }}
            />
            <div className="w-full flex justify-end gap-4 mt-4">
                {showState === "complete" ? (
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
                                        sendWSMessage("showStop", "");
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
