import { entryForFile } from "../../entry";
import {Md5} from "ts-md5";

const hasLeadingZeros = (s: string, n: number): boolean => {
    for (let i = 0; i < n; i++) {
        if (s[i] !== "0") {
            return false;
        }
    }
    return true;
};

export const theIdealStockingStuffer = entryForFile(
    async ({ lines, outputCallback }) => {
        const key = lines[0].trim();
        let i = 1;
        while (true) {
            const hashed = Md5.hashAsciiStr(key + i) as string;
            if (hasLeadingZeros(hashed, 5)) {
                await outputCallback("Found it: " + i);
                return;
            }
            i++;
        }

        await outputCallback(hasLeadingZeros(Md5.hashAsciiStr(key) as string, 1));
    },
    async ({ lines, outputCallback }) => {
        const key = lines[0].trim();
        let i = 1;
        while (true) {
            const hashed = Md5.hashAsciiStr(key + i) as string;
            if (hasLeadingZeros(hashed, 6)) {
                await outputCallback("Found it: " + i);
                return;
            }
            i++;
        }
    },
    {
        key: "the-ideal-stocking-stuffer",
        title: "The Ideal Stocking Stuffer",
        stars: 2,
        embeddedData: true
    }
);
