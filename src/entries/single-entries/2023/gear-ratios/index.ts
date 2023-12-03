import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { Coordinate, getFullSurrounding, serialization } from "../../../../support/geometry";
import { DefaultDict } from "../../../../support/data-structure";
import { exampleInput } from "./example";
import { FixedSizeMatrix } from "../../../../support/matrix";

export const gearRatios = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const matrix = new Parser(lines).matrixMixedNumbers();
        let res = 0;
        for (let y = 0; y < matrix.size.y; y++) {
            for (let x = 0; x < matrix.size.x; x++) {
                let number;
                ({ x, number } = scanNumber({x, y}, matrix, undefined));
                if (number !== undefined) {
                    res += number;
                }
            }
        }
        await resultOutputCallback(res);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const matrix = new Parser(lines).matrixMixedNumbers();
        const matchingMap = new DefaultDict<Coordinate, number[][]>(
            () => [], 
            serialization,
            {setOnGet: true}
        );
        for (let y = 0; y < matrix.size.y; y++) {
            for (let x = 0; x < matrix.size.x; x++) {
                ({ x } = scanNumber({x, y}, matrix, "*", matchingMap));
            }
        }
        const pairs = [...matchingMap.values]
            .filter(e => e.length === 2)
            .map(e => e.map(n => 
                n.reduce((acc, next) => acc * 10 + next, 0)
            ));
        await resultOutputCallback(pairs.reduce((acc, next) => acc + (next[0] * next[1]), 0));
    },
    {
        key: "gear-ratios",
        title: "Gear Ratios",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 3,
        stars: 2,
        exampleInput
    }
);

const scanNumber = (
    {x,y}: Coordinate, 
    matrix: FixedSizeMatrix<string | Number>, 
    matchingGear: string | undefined, 
    matchingMap?: DefaultDict<Coordinate, number[][]>
) => {
    let n = matrix.get({x,y});
    if (Parser.isNumber(n)) {
        const digits = [];
        let delta = 0;
        let isSurrounded = false;
        let hasMatchedGear = false;
        while (Parser.isNumber(n)) {
            const surroundings = getFullSurrounding({ x: x + delta, y })
                .map(e => ({coordinate: e, value: matrix.get(e)}))
                .filter(e => e.value !== ".")
                .filter(e => e.value !== undefined)
                .filter(e => !Parser.isNumber(e.value));
            
            isSurrounded = isSurrounded || surroundings.length > 0;
            const [matchingGearItem] = surroundings.filter(e => e.value === matchingGear);
            if (!hasMatchedGear && matchingMap && matchingGearItem) {
                hasMatchedGear = true;
                matchingMap.get(matchingGearItem.coordinate).push(digits);
            }
            digits.push(n);
            delta++;
            n = matrix.get({ y, x: x + delta })!;
        }
        x += delta;
        const number = digits.reduce((acc, next) => acc * 10 + next, 0);
        if (digits.length > 0 && isSurrounded) {
            return {x, number};
        }
    }
    return { 
        x, 
        number: undefined
    };
}