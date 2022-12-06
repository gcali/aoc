import fetch from "node-fetch";
import fs from "fs";

const arg = process.argv[2];

let day = new Date().getDate();

if (arg && arg.length > 0) {
    day = parseInt(arg, 10);
    if (day.toString() !== arg) {
        throw new Error("Invalid input");
    }
}

const token = fs.readFileSync("session", { encoding: "utf-8" }).split("\n")[0].trim();

const main = async () => {
    const result = await fetch(`https://adventofcode.com/2022/day/${day}/input`, {
        headers: {
            cookie: `session=${token}`
        }
    });

    const data = await result.text();

    fs.writeFileSync("./input.txt", data, { encoding: "utf-8" });

};

main().catch((e) => console.error(e));
