import { Queue } from "../../../../support/data-structure";
import { FullCoordinate, getSurrounding, serialization } from "../../../../support/geometry";
import { Coordinate3d } from "../../../../support/geometry";
import { manhattanDistance } from "../../../../support/geometry";
import { entryForFile } from "../../../entry";

const exampleInput =
`2,2,2
1,2,2
3,2,2
2,1,2
2,3,2
2,2,1
2,2,3
2,2,4
2,2,6
1,2,5
3,2,5
2,1,5
2,3,5`;

const parseLines = (lines: string[]): Coordinate3d[] => {
    return lines.map(line => {
        const [x,y,z] = line.split(",").map(e => parseInt(e, 10));
        return {x,y,z};
    });
}

export const boilingBoulders = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const cubes = parseLines(lines);
        let sides = 0;
        for (const cube of cubes) {
            let adjacent = 0;
            for (const other of cubes) {
                if (cube === other) {
                    continue;
                }
                if (manhattanDistance(cube, other) === 1) {
                    adjacent++;
                }
            }
            if (adjacent > 6) {
                throw new Error("How can that happen?");
            }
            sides += (6 - adjacent);
        }
        await outputCallback(sides);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const cubes = parseLines(lines);
        const existingCubes = new Set<string>();
        for (const cube of cubes) {
            existingCubes.add(serialization.serialize(cube));
        }
        const airFrontier: Set<string> = new Set<string>();
        /*A useful observation is that if we consider empty spaces which have a taxicab distance of at most two from any cube, and join these spaces into connected components, then the connected components we are left with form distinct air pockets in addition to one component containing empty spaces on the exterior.

This component can always be identified since the space with the largest x component will always lie in it. So we can determine empty spaces in the interior adjacent to cubes like so:

*/
        for (const cube of cubes) {
            const twiceSurrounding = getSurrounding(cube)
                .flatMap(c => [c].concat(getSurrounding(c)))
                .filter(e => manhattanDistance(e, cube) <= 2);
            const frontier = twiceSurrounding.filter(e => !existingCubes.has(serialization.serialize(e)));
            for (const f of frontier) {
                airFrontier.add(serialization.serialize(f));
            }
        }

        const groups: string[][] = [];
        while (airFrontier.size > 0) {
            const [visitFrom] = airFrontier;
            airFrontier.delete(visitFrom);
            const queue = new Queue<string>();
            queue.add(visitFrom);
            const group: string[] = [visitFrom];
            while (!queue.isEmpty) {
                const current = queue.get()!;
                const surrounding = getSurrounding(serialization.deserialize3d(current));
                for (const s of surrounding) {
                    const k = serialization.serialize(s);
                    if (airFrontier.has(k)) {
                        queue.add(k);
                        group.push(k);
                        airFrontier.delete(k);
                    }
                }
            }
            groups.push(group);
        }
        const externalGroup = groups.map(g => ({
            g,
            maxX: g.map(e => serialization.deserialize3d(e).x).reduce((acc, next) => Math.max(acc, next), Number.NEGATIVE_INFINITY)
        })).sort((a, b) => b.maxX - a.maxX)[0].g;
        const internalAir = [...new Set<string>(groups.filter(g => g !== externalGroup).flat())].map(e => serialization.deserialize3d(e));
        let sides = 0;
        for (const cube of cubes) {
            let adjacent = 0;
            for (const other of cubes.concat(internalAir)) {
                if (cube === other) {
                    continue;
                }
                if (manhattanDistance(cube, other) === 1) {
                    adjacent++;
                }
            }
            if (adjacent > 6) {
                throw new Error("How can that happen?");
            }
            sides += (6 - adjacent);
        }
        await outputCallback(sides);

        // const howManyAirCubes = cubes.length * 5;
        // const adding = new Queue<FullCoordinate>();
        // const all = new Set<string>();
        // let airCubes: FullCoordinate[] = [];
        // for (const cube of cubes) {
        //     all.add(serialization.serialize(cube));
        // }
        // for (const cube of cubes) {
        //     const surrounding = getSurrounding(cube);
        //     for (const s of surrounding) {
        //         const key = serialization.serialize(s);
        //         if (!all.has(key)) {
        //             adding.add(s);
        //             all.add(key);
        //             airCubes.push(s);
        //         }
        //     }
        // }
        // while (all.size < howManyAirCubes) {
        //     const next = adding.get();
        //     if (!next) {
        //         throw new Error("Cannot add");
        //     }
        //     const surrounding = getSurrounding(next);
        //     for (const s of surrounding) {
        //         const key = serialization.serialize(s);
        //         if (!all.has(key)) {
        //             adding.add(s);
        //             all.add(key);
        //             airCubes.push(s);
        //         }
        //     }
        // }

        // let updated = false;
        // do {
        //     updated = false;
        //     const toRemove = new Set<string>();
        //     for (const air of airCubes) {
        //         let adjacent = 0;
        //         for (const cube of cubes) {
        //             if (manhattanDistance(cube, air) === 1) {
        //                 adjacent++;
        //             }
        //         }
        //         for (const other of airCubes) {
        //             if (manhattanDistance(air, other) === 1) {
        //                 adjacent++;
        //             }
        //         }
        //         if (adjacent !== 6) {
        //             toRemove.add(serialization.serialize(air));
        //             updated = true;
        //         }
        //         airCubes = airCubes.filter(a => !toRemove.has(serialization.serialize(a)));
        //     }
        // } while (updated);

        // const allCubes: FullCoordinate[] = airCubes.concat(cubes);
        // let sides = 0;
        // for (const cube of cubes) {
        //     let adjacent = 0;
        //     for (const other of allCubes) {
        //         if (cube === other) {
        //             continue;
        //         }
        //         if (manhattanDistance(cube, other) === 1) {
        //             adjacent++;
        //         }
        //     }
        //     if (adjacent > 6) {
        //         throw new Error("How can that happen?");
        //     }
        //     sides += (6 - adjacent);
        // }
        // await outputCallback(sides);
    },
    {
        key: "boiling-boulders",
        title: "Boiling Boulders",
        supportsQuickRunning: true,
        embeddedData: true,
        exampleInput,
        stars: 2
    }
);