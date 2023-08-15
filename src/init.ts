import fetch from "node-fetch";
import fs from "fs";
import { parse } from "node-html-parser";
import { getLastYear } from "./support/entry-list-helper";
import { download } from "./download";

const arg = process.argv[2];

let day = new Date().getDate();

const year = getLastYear();

if (arg && arg.length > 0) {
    day = parseInt(arg, 10);
    if (day.toString() !== arg) {
        throw new Error("Invalid input");
    }
}

const token = fs.readFileSync("session", { encoding: "utf-8" }).split("\n")[0].trim();

const main = async () => {
    const result = await fetch(`https://adventofcode.com/${year}/day/${day}`, {
        headers: {
            cookie: `session=${token}`
        }
    });

    const raw = await result.text();

    const dom = parse(raw);

    const fullTitle = dom.querySelector("article.day-desc h2")?.innerText;
    if (!fullTitle) {
        throw new Error("Could not find title");
    }

    const extractor = /^-* Day \d\d?: (.*?) -*$/;
    const match = fullTitle.match(extractor);
    if (!match) {
        throw new Error("Invalid title format: " + fullTitle);
    }
    const title = match[1];
    const key = title.toLowerCase().split(" ").join("-");
    const entryName = title.toLowerCase().split(" ").map((e, i) => {
        if (i === 0) {
            return e
        }
        return e.charAt(0).toUpperCase() + e.slice(1);
    }).join("");

    const fileData = `import { entryForFile } from "../../../entry";

export const ${entryName} = entryForFile(
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
        key: "${key}",
        title: "${title}",
        supportsQuickRunning: true,
        embeddedData: true,
        date: ${day}
    }
);`


    const dirPath = `./src/entries/single-entries/${year}/${key}`;

    if (fs.existsSync(dirPath)) {
        throw new Error("Entry " + key + " already exists in " + year);
    }

    fs.mkdirSync(dirPath, {
        recursive: true
    });

    fs.writeFileSync(`${dirPath}/index.ts`, fileData, { encoding: "utf8" });

    await download(day, year);

    // const data = await result.text();


};
main().catch((e) => console.error(e));
