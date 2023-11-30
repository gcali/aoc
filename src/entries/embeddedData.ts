import { entryList } from "./entryList";

const parse = (data: string): string[] => {
    data = data.replaceAll("\r\n", "\n");
    if (data.endsWith("\n")) {
        data = data.slice(0, data.length-1);
    }
    return data.split("\n");
};

export const disabledYear: string | undefined = "2023";


export const embeddedLines = Object.keys(entryList).flatMap((year) => entryList[year].map((entry) => {
    return {
        year,
        entry
    };
})).filter((e) => e.entry.entry.metadata && e.entry.entry.metadata.embeddedData)
.reduce((acc, next) => {
    const metadata = next.entry.entry.metadata!;
    acc[metadata.key] = () => {
        console.log("Loading " + metadata.key);
        const key = metadata.embeddedData === true ? metadata.key : metadata.embeddedData!;
        return import(
            /* webpackChunkName: "[request]" */
            `../../data/${next.year}/${key}.txt`
        ).then(e => e.default as string).then(e => parse(e));
        // return parse(data);
        // const data = (await import(
        //     /* webpackChunkName: "[request]" */
        //     `../../data/${next.year}/${key}.txt`
        // )).default as string;
        // return parse(data);
    };
    return acc;
}, {} as { [key: string]: () => Promise<string[]>});
