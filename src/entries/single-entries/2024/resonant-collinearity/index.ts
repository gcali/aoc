import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { Coordinate, diffCoordinate, serialization, sumCoordinate } from "../../../../support/geometry";
import { DefaultDict } from "../../../../support/data-structure";
import { exampleInput } from "./example";
import { subsetGenerator } from "../../../../support/sequences";
import { gcd } from "../../../../support/algebra";

type Antenna = {
    frequency: string;
    position: Coordinate;
}

export const resonantCollinearity = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .matrix(e => e);
        
        const antennaLookup = new DefaultDict<string, Antenna[]>(() => []);
        ns.onEveryCellSyncUnsafe((c, e) => {
            if (e === ".") {
                return;
            }
            antennaLookup.ensureAndGet(e).push({
                frequency: e,
                position: c
            });
        });

        const antinodes: Set<string> = new Set<string>();

        for (const antennaKey of antennaLookup.keys) {
            const antennas = antennaLookup.get(antennaKey);
            const subsets = [...subsetGenerator(antennas, 0, 2)];
            for (const pair of subsets) {
                const delta = diffCoordinate(pair[0].position, pair[1].position);
                const first = sumCoordinate(pair[0].position, delta);
                const second = diffCoordinate(pair[1].position, delta);
                const localAntinodes = [first, second];
                for (const ant of localAntinodes) {
                    if (ns.get(ant) !== undefined) {
                        antinodes.add(serialization.serialize(ant));
                    }
                }
            }
        }
        await resultOutputCallback(antinodes.size);

    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .matrix(e => e);
        
        const antennaLookup = new DefaultDict<string, Antenna[]>(() => []);
        ns.onEveryCellSyncUnsafe((c, e) => {
            if (e === ".") {
                return;
            }
            antennaLookup.ensureAndGet(e).push({
                frequency: e,
                position: c
            });
        });

        const antinodes: Set<string> = new Set<string>();

        for (const antennaKey of antennaLookup.keys) {
            const antennas = antennaLookup.get(antennaKey);
            const subsets = [...subsetGenerator(antennas, 0, 2)];
            for (const pair of subsets) {
                const delta = diffCoordinate(pair[0].position, pair[1].position);
                const deltaGcd = gcd(Math.abs(delta.x), Math.abs(delta.y));
                if (Math.abs(deltaGcd) !== 1) {
                    delta.x /= deltaGcd;
                    delta.y /= deltaGcd;
                }
                const start = pair[0];
                let current = {...start.position};
                while (ns.get(current) !== undefined) {
                    antinodes.add(serialization.serialize(current));
                    current = sumCoordinate(current, delta);
                }
                current = {...start.position};
                while (ns.get(current) !== undefined) {
                    antinodes.add(serialization.serialize(current));
                    current = diffCoordinate(current, delta);
                }
            }
        }
        await resultOutputCallback(antinodes.size);
    },
    {
        key: "resonant-collinearity",
        title: "Resonant Collinearity",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 8,
        exampleInput: exampleInput,
        stars: 2
    }
);