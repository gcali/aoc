import { DefaultDict, SerializableSet } from "../../../../support/data-structure";
import { UnknownSizeField } from "../../../../support/field";
import { CCoordinate, Coordinate, directions, getBoundaries, getFullSurrounding, serialization } from "../../../../support/geometry";
import { entryForFile } from "../../../entry";

const exampleInput =
`....#..
..###.#
#...#.#
.#...##
#.###..
##.#.##
.#..#..`;

// const exampleInput =
// `.....
// ..##.
// ..#..
// .....
// ..##.
// .....`;

type Rule = {
    condition: CCoordinate[];
    moveTo: CCoordinate;
}

export const unstableDiffusion = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const rules: Rule[] = [
            {
                condition: getFullSurrounding({x:0,y:0}).filter(e => e.y === -1).map(e => new CCoordinate(e.x,e.y)),
                moveTo: directions.up
            },
            {
                condition: getFullSurrounding({x:0,y:0}).filter(e => e.y === 1).map(e => new CCoordinate(e.x,e.y)),
                moveTo: directions.down
            },
            {
                condition: getFullSurrounding({x:0,y:0}).filter(e => e.x === -1).map(e => new CCoordinate(e.x,e.y)),
                moveTo: directions.left
            },
            {
                condition: getFullSurrounding({x:0,y:0}).filter(e => e.x === 1).map(e => new CCoordinate(e.x,e.y)),
                moveTo: directions.right
            },
        ];

        let elves = new SerializableSet(serialization);
        for (let x = 0; x < lines[0].length; x++) {
            for (let y = 0; y < lines.length; y++) {
                if (lines[y][x] === "#") {
                    elves.add({x,y});
                }
            }
        }
        for (let i = 0; i < 10; i++) {
            const startingElves = elves.size;
            const proposals = new DefaultDict<Coordinate, Coordinate[]>(() => [], serialization);
            for (const elf of elves.values()) {
                const surrounding = getFullSurrounding(elf).filter(e => elves.has(e)).length;
                if (surrounding === 0) {
                    proposals.ensureAndGet(elf).push(elf);
                    continue;
                }
                const [rule] = rules.filter(r => r.condition.every(offset => {
                    const destination = offset.sum(elf);
                    return !elves.has(destination);
                }));
                if (rule) {
                    const destination = rule.moveTo.sum(elf);
                    const d = proposals.ensureAndGet(destination);
                    d.push(elf);
                } else {
                    proposals.ensureAndGet(elf).push(elf);
                }
            }
            elves = new SerializableSet(serialization);
            for (const key of proposals.keys) {
                const elements = proposals.get(key);
                if (elements.length === 1) {
                    elves.add(key);
                } else if (elements.length > 1) {
                    elements.forEach(e => elves.add(e));
                }
            }
            if (elves.size !== startingElves) {
                throw new Error("Number of elves changed");
            }
            const [removed] = rules.splice(0, 1);
            rules.splice(rules.length, 0, removed);
        }
        const bounds = getBoundaries([...elves.values()]);
        const size = bounds.size.x * bounds.size.y;
        const empty = size - elves.size;
        await resultOutputCallback(empty);
    },
    async ({ lines, pause, resultOutputCallback }) => {
        const rules: Rule[] = [
            {
                condition: getFullSurrounding({x:0,y:0}).filter(e => e.y === -1).map(e => new CCoordinate(e.x,e.y)),
                moveTo: directions.up
            },
            {
                condition: getFullSurrounding({x:0,y:0}).filter(e => e.y === 1).map(e => new CCoordinate(e.x,e.y)),
                moveTo: directions.down
            },
            {
                condition: getFullSurrounding({x:0,y:0}).filter(e => e.x === -1).map(e => new CCoordinate(e.x,e.y)),
                moveTo: directions.left
            },
            {
                condition: getFullSurrounding({x:0,y:0}).filter(e => e.x === 1).map(e => new CCoordinate(e.x,e.y)),
                moveTo: directions.right
            },
        ];

        let elves = new SerializableSet(serialization);
        for (let x = 0; x < lines[0].length; x++) {
            for (let y = 0; y < lines.length; y++) {
                if (lines[y][x] === "#") {
                    elves.add({x,y});
                }
            }
        }
        let round = 0;
        while (true) {
            await pause();
            round++;
            const startingElves = elves.size;
            const proposals = new DefaultDict<Coordinate, Coordinate[]>(() => [], serialization);
            const movingElves = new SerializableSet(serialization);
            for (const elf of elves.values()) {
                const surrounding = getFullSurrounding(elf).filter(e => elves.has(e)).length;
                if (surrounding === 0) {
                    proposals.ensureAndGet(elf).push(elf);
                    continue;
                }
                const [rule] = rules.filter(r => r.condition.every(offset => {
                    const destination = offset.sum(elf);
                    return !elves.has(destination);
                }));
                if (rule) {
                    const destination = rule.moveTo.sum(elf);
                    const d = proposals.ensureAndGet(destination);
                    d.push(elf);
                    movingElves.add(destination);
                } else {
                    proposals.ensureAndGet(elf).push(elf);
                }
            }
            const resultingElves = new SerializableSet(serialization);
            for (const key of proposals.keys) {
                const elements = proposals.get(key);
                if (elements.length === 1) {
                    resultingElves.add(key);
                } else if (elements.length > 1) {
                    elements.forEach(e => resultingElves.add(e));
                }
            }
            if (resultingElves.size !== startingElves) {
                throw new Error("Number of elves changed");
            }

            if (resultingElves.hasSameValuesAs(elves)) {
                break;
            }
            elves = resultingElves;
            
            const [removed] = rules.splice(0, 1);
            rules.splice(rules.length, 0, removed);
        }
        await resultOutputCallback(round);
    },
    {
        key: "unstable-diffusion",
        title: "Unstable Diffusion",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 23,
        exampleInput,
        stars: 2
    }
);

function serializeElves(elves: SerializableSet<Coordinate>) {
    const f = new UnknownSizeField<"#">();
    for (const e of elves.values()) {
        f.set(e, "#");
    }
    const s = f.toMatrix().toString(e => e || ".");
    return s;
}
