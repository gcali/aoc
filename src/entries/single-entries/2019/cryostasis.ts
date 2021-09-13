import { entryForFile } from "../../entry";
import { parseMemory, execute, stopExecution } from "../../../support/intcode";
import { UnknownSizeField } from "../../../support/field";
import { directions, CCoordinate, Coordinate, manhattanDistance } from "../../../support/geometry";
import { Field } from "./oxygen-system";
import { subsetGenerator } from "../../../support/sequences";

export const cryostasis = entryForFile(
    async ({ lines, outputCallback, additionalInputReader }) => {
        if (!additionalInputReader) {
            await outputCallback("This puzzle requires input from the user, cannot run");
            return;
        }
        const memory = parseMemory(lines[0]);
        const inputBuffer: number[] = [];
        const outputBuffer: number[] = [];
        const exploration = {
            exploringLocation: { x: 0, y: 0 } as (Coordinate | null),
            exploreResult: null as (string | null),
            explored: new Set<string>(),
            field: new UnknownSizeField<string>(),
            currentPosition: { x: 0, y: 0 },
            autoMovements: [] as string[]
        };

        const inventory = {
            elements: [] as string[],
            isPopulating: false
        };

        const hacking = {
            isHacking: false,
            subsets: [] as string[][],
            dropping: null as (string[] | null),
            lastDrop: null as (string[] | null),
            fullInventory: [] as string[],
            currentInventory: [] as string[],
            startPosition: null as (Coordinate | null),
            toRecover: [] as string[],
            isTooMuch: null as ("heavy" | "light" | null)
        };

        const possibleMovements = {
            populating: false,
            movements: [] as string[]
        };

        const autoTake = {
            enable: false,
            toTake: [] as string[],
            populating: false
        };

        const movementMap: { [key: string]: CCoordinate } = {
            north: directions.up,
            south: directions.down,
            east: directions.right,
            west: directions.left
        };


        const handleCustomCommand = async (line: string) => {
            await outputCallback("");
            const words = line.toLowerCase().split(" ").filter((e) => e.length > 0);
            const command = words[1];
            switch (command) {
                case "map":
                    const output = createMap(exploration);
                    await outputCallback(output);
                    break;
                case "inv":
                    await outputCallback("Inventory:");
                    for (const e of inventory.elements) {
                        await outputCallback("* " + e);
                    }
                    break;
                case "hack":
                    if (inventory.elements.length === 0) {
                        await outputCallback("Cannot hack without inventory");
                        break;
                    }
                    autoTake.enable = false;
                    hacking.subsets = [...subsetGenerator(inventory.elements, 0)];
                    hacking.isHacking = true;
                    hacking.fullInventory = [...inventory.elements];
                    hacking.currentInventory = [...inventory.elements];
                    hacking.startPosition = exploration.currentPosition;
                    break;

                case "auto-take":
                    autoTake.enable = !autoTake.enable;
                    await outputCallback("Auto take: " + autoTake.enable);
                    break;

                case "dirs":
                    await outputCallback("Doors here lead:");
                    for (const direction of possibleMovements.movements) {
                        await outputCallback("- " + direction);
                    }
                    break;

                case "auto-start":
                    if (manhattanDistance(exploration.currentPosition, { x: 0, y: 0 }) !== 0) {
                        await outputCallback("Can only explore automatically from the start");
                    } else {
                        exploration.autoMovements = [
                            "cheat auto-take",
                            "east",
                            "west",
                            "north",
                            "north",
                            "east",
                            "south",
                            "south",
                            "north",
                            "north",
                            "east",
                            "south",
                            "north",
                            "north",
                            "west",
                            "west",
                            "east",
                            "north",
                            "south",
                            "east",
                            "east",
                            "north",
                            "north",
                            "south",
                            "south",
                            "south",
                            "east",
                            "south",
                            "north",
                            "west",
                            "north",
                            "west",
                            "south",
                            "west",
                            "south",
                            "south",
                            "inv"
                        ];
                    }
                    break;


                case "clear":
                    await outputCallback(null);
                    break;

                default:
                    break;
            }
            await outputCallback("Command?");
        };

        const executeCommand = async (line: string) => {
            line.split("").map((e) => e.charCodeAt(0)).forEach((e) => inputBuffer.push(e));
            inputBuffer.push("\n".charCodeAt(0));
            await outputCallback("Executing: " + line);
        };
        await execute({
            memory,
            input: async () => {
                if (inputBuffer.length === 0) {
                    while (true) {
                        let line: string | null = null;
                        if (autoTake.enable && autoTake.toTake.length > 0) {
                            line = "take " + autoTake.toTake.shift()!;
                        } else if (hacking.isHacking) {
                            if (hacking.toRecover.length > 0) {
                                const candidate = hacking.toRecover.shift()!;
                                if (hacking.currentInventory.indexOf(candidate) < 0) {
                                    hacking.currentInventory.push(candidate);
                                    line = "take " + candidate;
                                } else {
                                    continue;
                                }
                            } else if (hacking.dropping === null) {
                                if (hacking.subsets.length === 0) {
                                    await outputCallback("Hacking failed");
                                    hacking.isHacking = false;
                                    continue;
                                }
                                if (hacking.isTooMuch === "light" && hacking.lastDrop !== null) {
                                    await outputCallback("----------------- Too light");
                                    const length = hacking.subsets.length;
                                    hacking.subsets = hacking.subsets.filter((subset) => {
                                        for (const hasDropped of hacking.lastDrop!) {
                                            if (subset.indexOf(hasDropped) < 0) {
                                                return true;
                                            }
                                        }
                                        return false;
                                    });
                                    const drop = length - hacking.subsets.length;
                                    if (drop > 0) {
                                        await outputCallback(`~~~~~~~~~ Hooray! Dropped ${drop}`);
                                    }
                                    await outputCallback("Remaining: " + hacking.subsets.length);
                                } else if (hacking.isTooMuch === "heavy" && hacking.lastDrop !== null) {
                                    await outputCallback("----------------- Too heavy");
                                    const length = hacking.subsets.length;
                                    hacking.subsets = hacking.subsets.filter((subset) => {
                                        for (const wouldDrop of subset) {
                                            if (hacking.lastDrop!.indexOf(wouldDrop) < 0) {
                                                return true;
                                            }
                                        }
                                        return false;
                                    });
                                    const drop = length - hacking.subsets.length;
                                    if (drop > 0) {
                                        await outputCallback(`~~~~~~~~~ Hooray! Dropped ${drop}`);
                                    }
                                    await outputCallback("Remaining: " + hacking.subsets.length);
                                }
                                hacking.dropping = hacking.subsets.shift()!;
                                hacking.lastDrop = [...hacking.dropping];
                                continue;
                            } else if (hacking.dropping.length === 0) {
                                line = "east";
                                hacking.dropping = null;
                            } else {
                                const toDrop = hacking.dropping.shift()!;
                                hacking.currentInventory = hacking.currentInventory.filter((e) => e !== toDrop);
                                line = "drop " + toDrop;
                            }
                        } else if (exploration.autoMovements.length > 0) {
                            line = exploration.autoMovements.shift()!;
                        } else {
                            line = await additionalInputReader.read();
                        }
                        if (line === null) {
                            stopExecution();
                            continue;
                        }
                        if (line.toLowerCase().startsWith("cheat")) {
                            await handleCustomCommand(line);
                            continue;
                        }
                        if (movementMap[line] !== undefined) {
                            const direction = movementMap[line];
                            exploration.exploringLocation = direction.sum(exploration.currentPosition);
                        }
                        await executeCommand(line);
                        break;
                    }
                }
                return inputBuffer.shift()!;
            },
            output: async (o) => {
                if ("\n".charCodeAt(0) === o) {
                    const line = outputBuffer.map((n) => String.fromCharCode(n)).join("");
                    const trimmed = line.trim();
                    if (trimmed.length === 0) {
                        possibleMovements.populating = false;
                    }
                    if (line.indexOf("Pressure-Sensitive Floor") >= 0) {
                        hacking.isTooMuch = null;
                    }
                    if (line.indexOf("loud, robotic voice says \"Alert!") >= 0) {
                        if (line.indexOf("are heavier than the detected") >= 0) {
                            hacking.isTooMuch = "light";
                        } else {
                            hacking.isTooMuch = "heavy";
                        }
                    }
                    if (line === "Command?") {
                        inventory.isPopulating = false;
                        autoTake.populating = false;
                        if (exploration.exploringLocation !== null && exploration.exploreResult !== null) {
                            if (hacking.isHacking) {
                                hacking.isHacking = false;
                                hacking.dropping = null;
                                hacking.subsets = [];
                                hacking.toRecover = [];
                            }
                            exploration.field.set(exploration.exploringLocation, exploration.exploreResult);
                            exploration.explored.add(exploration.exploreResult);
                            exploration.currentPosition = exploration.exploringLocation;
                            exploration.exploringLocation = null;
                            exploration.exploreResult = null;
                        }
                    } else if (possibleMovements.populating) {
                        possibleMovements.movements.push(trimmed.slice(2));
                    } else if (inventory.isPopulating && trimmed.length > 0) {
                        inventory.elements.push(trimmed.slice(2));
                    } else if (autoTake.populating && trimmed.length > 0) {
                        const item = trimmed.slice(2);
                        if ([
                            "infinite loop",
                            "giant electromagnet",
                            "escape pod",
                            "molten lava",
                            "photons"
                        ].indexOf(item) < 0) {
                            autoTake.toTake.push(item);
                        }
                    } else if (trimmed.startsWith("==")) {
                        if (exploration.exploringLocation !== null && exploration.exploreResult === null) {
                            exploration.exploreResult = trimmed;
                        } else if (exploration.exploreResult !== null) {
                            exploration.exploreResult = null;
                            exploration.exploringLocation = null;
                            if (hacking.isHacking) {
                                // failed exploration
                                hacking.toRecover = [...inventory.elements];
                            }
                        }
                    } else if (trimmed === "Items in your inventory:") {
                        inventory.isPopulating = true;
                        inventory.elements = [];
                    } else if (trimmed === "Items here:" && autoTake.enable) {
                        autoTake.populating = true;
                        autoTake.toTake = [];
                    } else if (trimmed === "Doors here lead:") {
                        possibleMovements.populating = true;
                        possibleMovements.movements = [];
                    }
                    await outputCallback(line);
                    outputBuffer.length = 0;
                } else {
                    outputBuffer.push(o);
                }
            }
        });

        await outputCallback("Program finished");
        await outputCallback(createMap(exploration));
        additionalInputReader.close();
    },
    async ({ lines, outputCallback }) => {
        throw Error("Not implemented");
    },
    { key: "cryostasis", title: "Cryostasis", stars: 2, hasAdditionalInput: true, embeddedData: true }
);

function createMap(
    exploration: {
        exploringLocation: Coordinate | null;
        exploreResult: string | null;
        explored: Set<string>;
        field: UnknownSizeField<string>;
        currentPosition: { x: number; y: number; };
        autoMovements: string[];
    }
) {
    const maxLength = [...exploration.explored.values()].reduce((acc, next) => Math.max(acc, next.length), 0);
    const matrix = exploration.field.toMatrix();
    const output = matrix.toString((e) => {
        if (!e) {
            return "".padStart(maxLength, " ");
        }
        const padding = maxLength - e.length;
        return "".padStart(Math.floor(padding / 2), " ") + e + "".padEnd(Math.ceil(padding / 2), " ");
    });
    return output;
}
