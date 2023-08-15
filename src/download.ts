import fetch from "node-fetch";
import fs from "fs";
import { getLastYear } from "./support/entry-list-helper";

export const download = async (day: number, year: string) => {
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
    const arg = process.argv[2];

    let day = new Date().getDate();

    const year = getLastYear();

    if (arg && arg.length > 0) {
        day = parseInt(arg, 10);
        if (day.toString() !== arg) {
            throw new Error("Invalid input");
        }
    }

    await download(day, year);
};

main().catch((e) => console.error(e));
