import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";

export const hotSprings = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .asNumbers()
            .run();
        let result: any = 0
        for (let i = 0; i < ns.length; i++) { 
            const x = ns[i];
        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .asNumbers()
            .run();
        let result: any = 0
        for (let i = 0; i < ns.length; i++) { 
            const x = ns[i];
        }
        await resultOutputCallback(result);
    },
    {
        key: "hot-springs",
        title: "Hot Springs",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 12
    }
);