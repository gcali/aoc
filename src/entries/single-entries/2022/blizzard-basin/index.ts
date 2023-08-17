import { entryForFile } from "../../../entry";

export const blizzardBasin = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = lines.map(l => parseInt(l, 10));
        let result: any = 0
        for (const x of lines) { 
        }
        for (const x of ns) { 
        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = lines.map(l => parseInt(l, 10));
        let result: any = 0
        for (const x of lines) { 
        }
        for (const x of ns) { 
        }
        await resultOutputCallback(result);
    },
    {
        key: "blizzard-basin",
        title: "Blizzard Basin",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 24
    }
);