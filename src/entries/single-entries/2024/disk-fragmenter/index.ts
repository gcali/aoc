import { OutputCallback, ResultOutputCallback, entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";

type Block = ({
    type: "empty";
} | {
    type: "block";
    id: number;
}) & {
    length: number;
}

export const diskFragmenter = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const result = await runDay(lines, rearrange, outputCallback);
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const result = await runDay(lines, blockRearrange, outputCallback);
        await resultOutputCallback(result);
    },
    {
        key: "disk-fragmenter",
        title: "Disk Fragmenter",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 9,
        exampleInput: exampleInput,
        stars: 2
    }
);

async function runDay(lines: string[], rearranger: (inputBlocks: Block[]) => Block[], outputCallback: OutputCallback) {
    const input = parseInput(lines[0]);
    const shouldVisualize = input.length < 20;
    if (shouldVisualize) {
        await outputCallback(visualize(input));
    }
    const rearranged = rearranger(input);
    if (shouldVisualize) {
        await outputCallback(visualize(rearranged));
    }
    const result = calculateChecksum(rearranged);
    return result;
}

const visualize = (blocks: Block[]): string => {
    const output: string[] = [];

    for (const block of blocks) {
        for (let i = 0; i < block.length; i++) {
            if (block.type === "empty") {
                output.push(".");
            } else {
                output.push(block.id.toString());
            }
        }
    }
    return output.join("");
}

const findNextBlock = (blocks: Block[], startIndex: number, id: number | null = null): {index: number; id: number} | null => {
    for (let i = blocks.length - 1; i >= startIndex; i--) {
        const block = blocks[i];
        if (block.type === "block" && (id === null || block.id === id)) {
            return {index: i, id: block.id};
        }
    }
    return null;
}

const rearrange = (inputBlocks: Block[]): Block[] => {
    const blocks = inputBlocks.map(b => ({...b}));
    let currentIndex = 0;
    while (currentIndex < blocks.length) {
        const currentBlock = blocks[currentIndex];
        if (currentBlock.type === "block") {
            currentIndex++;
        } else if (currentBlock.length === 0) {
            blocks.splice(currentIndex, 1);
        } else {
            const nextBlockData = findNextBlock(blocks, currentIndex + 1);
            if (nextBlockData === null) {
                break;
            }
            const nextBlock = blocks[nextBlockData.index];
            const removable = Math.min(currentBlock.length, nextBlock.length);
            currentBlock.length -= removable;
            nextBlock.length -= removable;
            if (nextBlock.length === 0) {
                blocks.splice(nextBlockData.index, 1);
            }
            blocks.splice(currentIndex, 0, {
                type: "block",
                length: removable,
                id: nextBlockData.id
            });
            if (currentBlock.length === 0) {
                blocks.splice(currentIndex + 1, 1);
            }
            currentIndex++;
        }
    }
    return blocks.slice(0, currentIndex);
}

const blockRearrange = (inputBlocks: Block[]): Block[] => {
    const blocks = inputBlocks.map(e => ({...e}));
    const lastBlock = blocks[blocks.length-1];
    if (lastBlock.type === "empty") {
        throw new Error("Something went wrong");
    }
    let nextId = lastBlock.id;
    while (nextId >= 0) {
        const nextBlockData = findNextBlock(blocks, 0, nextId);
        if (nextBlockData === null) {
            throw new Error("What happened here?");
        }
        const blockToMove = blocks[nextBlockData.index];
        for (let j = 0; j < nextBlockData.index; j++) {
            const candidateBlock = blocks[j];
            if (candidateBlock.type === "block") {
                continue;
            }
            if (blocks[j].length >= blockToMove.length) {
                blocks[j].length -= blockToMove.length;
                blocks.splice(j, 0, {...blockToMove});
                blockToMove.type = "empty";
                break;
            }
        }
        nextId--;
    }
    for (let i = blocks.length - 1; i > 0; i--) {
        const block = blocks[i];
        if (block.length === 0) {
            if (block.type !== "empty") {
                throw new Error("What happened?");
            }
            blocks.splice(i, 1);
        }
    }
    return blocks;
}

const parseInput = (line: string): Block[] => {
    let isBlock = true;
    const result: Block[] = [];
    let nextId = 0;
    for (const token of line.split("")) {
        const v = parseInt(token, 10);
        let block: Block;
        if (isBlock) {
            block = {
                length: v,
                id: nextId,
                type: "block"
            };
            nextId++;
        } else {
            block = {
                type: "empty",
                length: v
            }
        }
        isBlock = !isBlock;
        if (block.length > 0) {
            result.push(block);
        }
    }
    return result;
}

const calculateChecksum = (blocks: Block[]): number => {
    let result = 0;
    let position = 0;
    for (const block of blocks) {
        for (let i = 0; i < block.length; i++) {
            if (block.type !== "empty") {
                result += position * block.id;
            }
            position++;
        }
    }
    return result;
}
