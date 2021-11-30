import { entryForFile } from "../../../entry";

export const entry = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const data = lines.map(e => parseInt(e, 10));

        for (const x of data) {
            for (const y of data) {
                if (x + y === 2020) {
                    await resultOutputCallback(x*y);
                    return;
                }
            }
        }
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const data = lines.map(e => parseInt(e, 10));
        for (const x of data) {
            for (const y of data) {
                for (const z of data) {
                    if (x + y + z === 2020) {
                        await resultOutputCallback(x*y*z);
                        return;
                    }
                }
            }
        }
        
    },
    {
        key: "key",
        title: "title",
        supportsQuickRunning: true,
        embeddedData: true
    }
);