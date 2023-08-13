import fs from "fs";
import * as readline from "readline";

export type Reader = (callback: (lines: string[]) => Promise<void>) => void;

export const stdinReadLineByLine = (callback: (line: string | null) => void): (() => void) => {
    const i = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    }); 
    i.on("line", (line: string) => callback(line));
    i.on("close", () => callback(null));
    let hasClosed = false;
    return () => {
        if (!hasClosed) {
            i.close();
            hasClosed = true;
        }
    };
}

export const readStdin: Reader = (callback: (lines: string[]) => Promise<void>) => {
    const i = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    const lines: string[] = [];
    i.on("line", (line: string) => {
        lines.push(line);
    });
    // const promise = new Promise<void>((resolve) => {
    i.on("close", () => callback(lines));
    // });
} 

export const generateFileReader = (filePath: string): Reader => {
    return (callback: (lines: string[]) => Promise<void>) => {
        fs.readFile(filePath, (err, data) => {
            if (err && err.code) {
                throw new Error(`(${err.code}) ${err.message}`);
            }
            let lines = data.toString().split("\n");
            if (lines.length > 0 && lines[lines.length-1].length === 0) {
                lines = lines.slice(0, lines.length - 1);
            }
            callback(lines);
        });
    }
}