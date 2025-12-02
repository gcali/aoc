import fetch from "node-fetch";
import fs from "fs";
import { getLastYear } from "./support/entry-list-helper";

export const download = async (day: number, year: number) => {

    console.log(`Downloading ${year}-${day}`)

    const time = new Date().getTime();
    fs.writeFileSync("time", time.toString(), { encoding: 'utf8'});

    const token = fs.readFileSync("session", { encoding: "utf-8" }).split("\n")[0].trim();

    const result = await fetch(`https://adventofcode.com/${year}/day/${day}/input`, {
        headers: {
            cookie: `session=${token}`
        }
    });

    const data = await result.text();

    fs.writeFileSync("./input.txt", data, { encoding: "utf8" });
}


const main = async () => {
    const dayArg = process.argv[2];
    const yearArg = process.argv[3];

    const day = parseArg(dayArg, new Date().getDate());

    const year = parseArg(yearArg, parseInt(getLastYear(), 10));

    await download(day, year);
};

main().catch((e) => console.error(e));

export function parseArg(dayArg: string, day: number) {
    if (dayArg && dayArg.length > 0) {
        day = parseInt(dayArg, 10);
        if (day.toString() !== dayArg) {
            throw new Error("Invalid input");
        }
    }
    return day;
}

