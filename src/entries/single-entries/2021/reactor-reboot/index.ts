import { defaultMaxListeners } from "stream";
import { Coordinate3d, isInBounds, serialization } from "../../../../support/geometry";
import { defaultSerializers } from "../../../../support/serialization";
import { entryForFile } from "../../../entry";

type Range = {
    from: number;
    to: number;
};

type Instruction = {
    action: "on" | "off";
    x: Range;
    y: Range;
    z: Range;
};

function* overRange(range: Range, bounds?: Range): Iterable<number> {
    for (let i = Math.max(range.from, (bounds || range).from); i <= Math.min(range.to, (bounds || range).to); i++) {
        yield i;
    }
}

const parseInput = (lines: string[]): Instruction[] => {
    const parseRange = (s: string): Range => {
        const [from, to] = s.slice(2).split("..").map((e) => parseInt(e, 10)).sort((a, b) => a - b);
        return { from, to };
    };
    return lines.map((line) => {
        const [action, rest] = line.split(" ");
        if (action !== "on" && action !== "off") {
            throw new Error("Invalid action " + action);
        }
        const [x, y, z] = rest.split(",").map(parseRange);
        return { action, x, y, z };
    });
};

class Grid {
    private readonly turnedOn = new Set<string>();

    public turnOn(c: Coordinate3d) {
        this.turnedOn.add(this.ser(c));
    }

    public turnOff(c: Coordinate3d) {
        this.turnedOn.delete(this.ser(c));
    }

    public *getTurnedOn(): Iterable<Coordinate3d> {
        for (const item of this.turnedOn) {
            yield this.de(item);
        }
    }

    public isTurnedOn(c: Coordinate3d): boolean {
        return this.turnedOn.has(this.ser(c));
    }

    private ser(c: Coordinate3d) {
        return serialization.serialize(c);
    }

    private de(s: string): Coordinate3d {
        return serialization.deserialize3d(s);
    }
}

const isInRange = (c: Coordinate3d | number, r: Range): boolean => {
    if (typeof c === "number") {
        return c >= r.from && c <= r.to;
    }
    return isInRange(c.x, r) && isInRange(c.y, r) && isInRange(c.z, r);
};

export const reactorReboot = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const instructions = parseInput(lines);
        const grid = new Grid();
        const baseRange = { from: -50, to: 50 };
        for (const i of instructions) {
            for (const x of overRange(i.x, baseRange)) {
                for (const y of overRange(i.y, baseRange)) {
                    for (const z of overRange(i.z, baseRange)) {
                        const c = { x, y, z };
                        if (i.action === "on") {
                            grid.turnOn(c);
                        } else {
                            grid.turnOff(c);
                        }
                    }
                }
            }
            // console.log(...grid.getTurnedOn());
            // console.log(([...grid.getTurnedOn()].length));
        }

        const count = [...grid.getTurnedOn()].length;
        await resultOutputCallback(count);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
    },
    {
        key: "reactor-reboot",
        title: "Reactor Reboot",
        supportsQuickRunning: true,
        embeddedData: true
    }
);
