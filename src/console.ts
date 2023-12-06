import minimist from "minimist";
import clipboard from "clipboardy";
import fs from "fs";

const args = (minimist as any)(process.argv.slice(2), {
    alias: { 
        e: "entry", 
        h: "help", 
        s: "second", 
        l: "list", 
        y: "year", 
        n: "noNumber", 
        f: "file",
        q: "quick",
        x: "example",
        a: "auto"
    },
    number: ["e", "y"],
    default: {
        "y": null,
        "e": null,
        "n": false,
        "f": null,
        "q": false,
        "x": false,
        "a": false
    },
    string: ["file"],
    boolean: ["help", "second", "list", "noNumber", "quick", "example", "auto"],
});


const usage =
    `Usage: ${process.argv[1]} [options]

Options:
    -h, --help: print help
    -e, --entry <entry>: Identify which entry to run; if missing, run last entry
    -s, --second: choose second part instead of first
    -l, --list: list entries,
    -y, --year: year,
    -n, --noNumber: hide number in list, optional, default to false
    -q, --quick: run with minimal output and prints the time of execution
    -f, --file: file to read from
    -x, --example: use example input
    -a, --auto: automatically find the input file
`;

const error = () => { console.log(usage); process.exit(1); };

if (args.h) {
    console.log(usage);
    process.exit(0);
}

import { entryList } from "./entries/entryList";
import {getLastIndex, getLastYear} from "./support/entry-list-helper";

const year: string = args.y === null ? getLastYear() : args.y;

if (args.l) {
    let i = 0;
    for (const entry of entryList[year]) {
        if (entry.date) {
            i = entry.date;
        }
        console.log(args.n ? entry.title : `${i++} - ${entry.title} ${[...new Array(entry.stars || 0)].map(e => "★").join(" ")}`);
    }
    process.exit(0);
}

const index = getLastIndex(year, args.e);
if (index < 0 || index >= entryList[year].length) {
    error();
}


const entryCallback = entryList[year][index].entry;


import { readStdin, Reader, generateFileReader, stdinReadLineByLine } from "./support/stdin-reader";
import { serializeTime } from "./support/time";

const isAuto = args.a;
const isReadingFromFile = (args.f !== null && args.f.length > 0) || isAuto;
let reader: Reader | null = null;
let additionalInputReader: undefined | {
    read: () => Promise<string | null>;
    close: () => void;
};

const getAutoFilePath = () => {
    if (!entryCallback.metadata) {
        throw new Error("Cannot automatically generate file without metadata");
    }
    const key = entryCallback.metadata.key;
    const dataFile = `./data/${year}/${key}.txt`;
    if (fs.existsSync(dataFile)) {
        return dataFile;
    }
    if (fs.existsSync("./input.txt")) {
        return "./input.txt";
    }
    throw new Error("No valid input file found");
}

const isExample = args.x === true;
if (isExample) {
    if (!entryCallback.metadata || !entryCallback.metadata.exampleInput) {
        throw new Error("Cannot use example input if not given");
    }
    reader = (callback) => {
        const lines = entryCallback.metadata!.exampleInput!.split("\n");
        callback(lines);
    };

} else if (isReadingFromFile) {
    const filePath = isAuto ? getAutoFilePath() : args.f;
    reader = generateFileReader(filePath);
    const lines: (string | null)[] = [];
    let resolver: ((s: string | null) => void) | null = null;
    const additionalReader = async (): Promise<string | null> => {
        if (lines.length > 0) {
            const first = lines.shift()!;
            return first;
        } else {
            return await new Promise<string | null>((resolve, reject) => resolver = resolve);
        }
    }
    const closer = stdinReadLineByLine(line => {
        if (resolver !== null) {
            const r = resolver;
            resolver = null;
            r(line);
        } else {
            lines.push(line);
        }
    });
    additionalInputReader = {
        close: closer,
        read: additionalReader
    };
} else {
    reader = readStdin;
}

reader(async (lines) => {
    const baseOutputCallback = async (line: string) => {
        if (line === null) {
            console.clear();
        } else {
            console.log(line);
        }
    }
    let resultCalls = 0;
    const outputCallback = args.q ? async () => {} : baseOutputCallback;
    const startTime = new Date().getTime();
    const resultOutputCallback = async (line: any) => {
        if (resultCalls > 0) {
            throw new Error("Can execute result output only once");
        }
        resultCalls++;
        if (typeof line === "string" || typeof line === "number") {
            clipboard.writeSync(line.toString());
            console.log(line);
        } else {
            console.log(JSON.stringify(line));
        }
        if (args.q) {
            console.log(`Time: ${new Date().getTime() - startTime}ms`);

        }
        const timeData = fs.readFileSync("time", {encoding: "utf8"});
        if (timeData) {
            const time = parseInt(timeData, 10);
            const currentTime = new Date().getTime();
            const delta = currentTime - time;
            console.log("Total time: " + serializeTime(delta));
        }
    };

    try {
        if (args.s) {
            await entryCallback.second({
                isCancelled: () => false,
                lines,
                outputCallback,
                pause: async () => { },
                setAutoStop: () => { },
                additionalInputReader,
                resultOutputCallback,
                isQuickRunning: args.q || false,
                mediaQuery: {
                    isMobile() {
                        return false;
                    }
                },
                isExample
            });
        } else {
            await entryCallback.first({
                lines,
                outputCallback,
                isCancelled: () => false,
                pause: async () => { },
                setAutoStop: () => { },
                additionalInputReader,
                resultOutputCallback,
                isQuickRunning: args.q || false,
                mediaQuery: {
                    isMobile() {
                        return false;
                    }
                },
                isExample
            });
        }
    } finally {
        if (additionalInputReader) {
            additionalInputReader.close();
        }
    }
});

