import { entryForFile } from "../../entry";
export const highEntropyPasshprases = entryForFile(
    async ({ lines, outputCallback, pause, isCancelled }) => {
        const uniqueLines = lines.filter((line) => {
            const words = line.split(" ");
            const uniqueWords = new Set(words);
            return words.length === uniqueWords.size;
        }).length;
        await outputCallback(uniqueLines);
    },
    async ({ lines, outputCallback, pause, isCancelled }) => {
        const uniqueLines = lines.filter((line) => {
            const words = line.split(" ").map((word) => [...word].sort().join(""));
            const uniqueWords = new Set(words);
            return words.length === uniqueWords.size;
        }).length;
        await outputCallback(uniqueLines);
    },
    { key: "high-entropy-passphrases", title: "High-Entropy Passphrases", stars: 2  }
);

