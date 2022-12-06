import { entryForFile } from "../../../entry";

const findStartOfPacket = (line: string, length: number): number => {
    const seen: string[] = [];
    for (let i = 0; i < line.length; i++) {
        if (seen.length === length) {
            seen.shift();
        }
        seen.push(line[i]);
        if (new Set<string>(seen).size === length) {
            return i + 1;
        }
    }
    throw new Error("Marker not found");
}

export const tuningTrouble = entryForFile(
    async ({ lines, resultOutputCallback }) => {
        const index = findStartOfPacket(lines[0], 4);
        await resultOutputCallback(index);
    },
    async ({ lines, resultOutputCallback }) => {
        const index = findStartOfPacket(lines[0], 14);
        await resultOutputCallback(index);
    },
    {
        key: "tuning-trouble",
        title: "Tuning Trouble",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);