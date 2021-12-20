import fetch from "node-fetch";
import fs from "fs";

const token = fs.readFileSync("session", { encoding: "utf-8" }).split("\n")[0].trim();

const main = async () => {
    const result = await fetch("https://adventofcode.com/2021/day/20/input", {
        headers: {
            cookie: `session=${token}`
        }
    });

    const data = await result.text();

    fs.writeFileSync("./input.txt", data, { encoding: "utf-8" });

};

main().catch((e) => console.error(e));
