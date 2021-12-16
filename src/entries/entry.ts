import { Choice } from "../constants/choice";
import { Coordinate } from "../support/geometry";
import { Message } from "./entryStatusMessages";

export interface ScreenBuilder { requireScreen: (size?: Coordinate) => Promise<ScreenPrinter>; }

const ensureEmebedded = (e: string | true | undefined): string | true => {
    return typeof e === "string" ? e : true;
};

export const embedAll = (entries: Entry[]): Entry[] => entries.map((e) => {
    if (e.metadata) {
        return {
            ...e,
            metadata: { ...e.metadata, embeddedData: ensureEmebedded(e.metadata.embeddedData) }
        };
    } else {
        return e;
    }
});

export interface EntryCallbackArg {
    lines: string[];
    outputCallback: OutputCallback;
    resultOutputCallback: ResultOutputCallback;
    pause: Pause;
    isCancelled: (() => boolean);
    setAutoStop: () => void;
    additionalInputReader?: {
        read: () => Promise<string | null>;
        close: () => void;
    };
    screen?: ScreenBuilder;
    mediaQuery: MediaQuery;
    isQuickRunning: boolean;
    sendMessage?: MessageSender;
}

export type Pause = (times?: number) => Promise<void>;

type OldEntryCallback = (
    lines: string[],
    outputCallback: ((outputLine: any) => Promise<void>),
    statusCallback?: ((outputStatus: Message) => Promise<void>)
) => Promise<void>;

export type OutputCallback = (outputLine: any, shouldClear?: boolean) => Promise<void>;
export type ResultOutputCallback = (outputLine: any) => Promise<void>;

type EntryCallback = (arg: EntryCallbackArg) => Promise<void>;

interface EntryMetadata {
    key: string;
    stars?: 1 | 2;
    title: string;
    date?: number;
    hasAdditionalInput?: boolean;
    suggestedDelay?: number;
    customComponent?: "pause-and-run" | "graph";
    supportsQuickRunning?: boolean;
    embeddedData?: string | true;
    canvasBackground?: string;
    variants?: Entry[];
}

export interface Entry {
    first: EntryCallback;
    second: EntryCallback;
    metadata?: EntryMetadata;
}

export function entryForFile(first: EntryCallback, second: EntryCallback, metadata?: EntryMetadata): Entry {
    return {
        first,
        second,
        metadata
    };
}
export function oldEntryForFile(first: OldEntryCallback, second: OldEntryCallback): Entry {
    return {
        first: (args: EntryCallbackArg) => (first(args.lines, args.outputCallback)),
        second: (args: EntryCallbackArg) => (second(args.lines, args.outputCallback))
    };
}

export interface EntryFileHandling {
    choice: Choice;
    content: string[];
}

export function simpleOutputCallbackFactory(output: string[], avoidOutput?: () => boolean) {
    return (outputLine: any, shouldClear?: boolean): Promise<void> => {
        if (avoidOutput && avoidOutput()) {
            return new Promise((resolve) => resolve());
        }
        if (shouldClear) {
            output.length = 0;
        }

        if (outputLine === null) {
            output.length = 0;
        } else if (typeof (outputLine) === "string") {
            output.push(outputLine);
        } else if (Array.isArray(outputLine)) {
            output.push(outputLine.join("\n"));
        } else {
            output.push(JSON.stringify(outputLine, undefined, 4));
        }
        return new Promise<void>((resolve) => setTimeout(resolve, 0));
    };
}

export type Drawable = {
    id: string;
    color: string;
} & ({
    type: "rectangle";
    c: Coordinate;
    size: Coordinate;
} | {
    type: "points";
    points: Coordinate[];
});

export interface ScreenPrinter {
    add: (item: Drawable) => Promise<void>;
    addForeground: (item: Drawable) => Promise<void>;
    remove: (id: string) => Promise<void>;
    stop: () => Promise<void>;
    replace: (items: Drawable[]) => Promise<void>;
    changeColor: (indexOrId: string | number, color: string) => Promise<void>;
    pause: () => (() => void);
    forceRender: () => void;
    setManualRender: () => void;
    setManualInvalidate: () => void;
    invalidate: (id: string | Drawable) => void;
    getImage(): Promise<Blob>;
}

export interface MediaQuery {
    isMobile(): boolean;
}

export type MessageSender = (message: any) => Promise<void>;
interface ExecutionArgs {
    entry: Entry;
    choice: Choice;
    lines: string[];
    outputCallback: EntryCallbackArg["outputCallback"];
    isCancelled: (() => boolean);
    pause?: () => Promise<void>;
    sendMessage?: MessageSender;
    additionalInputReader?: {
        read: () => Promise<string | null>;
        close: () => void;
    };
    screen?: {
        requireScreen: (size?: Coordinate) => Promise<ScreenPrinter>;
    };
    mediaQuery: MediaQuery;
    isQuickRunning: boolean;
    stopTimer: () => void;
}

export class StopException extends Error {
    public isStop = true;
}

export async function executeEntry({
    entry,
    choice,
    lines,
    outputCallback,
    isCancelled,
    pause,
    additionalInputReader,
    screen,
    isQuickRunning,
    stopTimer,
    sendMessage,
    mediaQuery
}: ExecutionArgs
) {
    let callback: EntryCallback;
    if (choice === Choice.first) {
        callback = entry.first;
    } else {
        callback = entry.second;
    }
    try {
        const basePause = pause || (() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
        let shouldAutoStop = false;
        const wrappedPause = async (times?: number) => {
            if (isQuickRunning) {
                return;
            }
            times = times || 1;
            for (let i = 0; i < times; i++) {
                if (shouldAutoStop && isCancelled()) {
                    throw new StopException();
                }
                await basePause();
                if (shouldAutoStop && isCancelled()) {
                    throw new StopException();
                }
            }
        };
        let resultOutput = 0;
        await callback({
            lines,
            outputCallback: !isQuickRunning ? outputCallback : async () => { },
            resultOutputCallback: isQuickRunning ? async (line: any, shouldClear?: boolean) => {
                if (resultOutput > 0) {
                    throw new Error("Cannot output results more than once");
                }
                stopTimer();
                resultOutput++;
                await outputCallback(line, shouldClear);
            } : outputCallback,
            pause: wrappedPause,
            isCancelled,
            additionalInputReader,
            screen: isQuickRunning ? undefined : screen,
            setAutoStop: () => shouldAutoStop = true,
            isQuickRunning,
            sendMessage,
            mediaQuery
        });
    } catch (e) {
        if ((e as StopException).isStop) {
            console.log("Stopped, all fine");
            return;
        }
        await outputCallback("ERROR: " + (e as Error).message);
        console.error(e);
    }
}
