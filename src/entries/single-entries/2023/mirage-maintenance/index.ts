import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";

import binomial from "binomial";

const generateCoefficients = (n: number, index: number): number[] => {
    let result = [];
    for (let i = 0; i < n; i++) {
        result.push(i === index ? 1 : 0);
    }
    return result;
}

const substractCoefficients = (a: number[], b: number[]): number[] => {
    return b.map((e, i) => a[i] - b[i]);
}

const serializeCoefficients = (a: number[]) => {
    return a.map(e => e.toString()).join(",");
}

const serializeLine = (a: number[][]) => {
    return a.map(serializeCoefficients);
}

const generateLastCoefficients = (numbers: number[]): number[] => {
    const nMax = numbers.length;
        const expected = [];
        for (let i = 0; i < nMax; i++) {
            const res = [];
            for (let j = 0; j < nMax; j++) {
                const delta = j - (nMax - i - 1);
                if (delta < 0) {
                    res.push(0);
                } else {
                    const coeff = binomial.get(i, delta);
                    const sign = j % 2 === (nMax-1)%2 ? 1 : -1;
                    res.push(coeff * sign);
                }
            }
            expected.push(res);
        }
        return expected.map((c) => c.reduce((acc, next, i) => acc + next * numbers[i], 0));
}

export const mirageMaintenance = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .extractAllNumbers(true)
            .run();

        // const n = 14;
        // const binomialCoefficients = [];
        // for (let i = 0; i <= n; i++) {
        //     binomialCoefficients.push(binomial.get(n, i));
        // }

        const nMax = 15;

        const n = nMax;

            const coeff = [];
            for (let i = 0; i < n; i++) {
                coeff.push(generateCoefficients(n, i));
            }
            const res = [];
            let coeffs = coeff;
            const lastCoeffs = [coeffs[coeffs.length-1]];
            // console.log(coeffs);
            // console.log(substractCoefficients([1,0], [0,1]));
            // console.log("-----");
            for (let i = 0; i < n; i++) {
                // if (i === 0) {
                //     for (let j = 1; j < n; j++) {
                //         console.log(substractCoefficients(coeffs[j], coeffs[j-1]));
                //     }
                // }
                coeffs = coeffs.slice(1).map((c, i) => substractCoefficients(coeffs[i+1], coeffs[i]));
                // if (i === 0) {
                //     console.log(coeffs);
                // }
                res.push(coeffs);
                if (coeffs.length > 0) {
                    lastCoeffs.push(coeffs[coeffs.length-1]);
                }
            }
            console.log(lastCoeffs.filter(e => e));

        const expected = [];
        for (let i = 0; i < nMax; i++) {
            const res = [];
            for (let j = 0; j < nMax; j++) {
                const delta = j - (nMax - i - 1);
                if (delta < 0) {
                    res.push(0);
                } else {
                    const coeff = binomial.get(i, delta);
                    const sign = j % 2 === (nMax-1)%2 ? 1 : -1;
                    res.push(coeff * sign);
                }
            }
            expected.push(res);
        }

        console.log("-------");

        console.log(expected);

        let result = 0;
        for (const line of ns) {
            let currentState = [...line];
            const lastElements = [currentState[currentState.length-1]];
            let newState = [];
            while (currentState.length > 1 && currentState.some(e => e !== 0)) {
                for (let i = 1; i < currentState.length; i++) {
                    newState.push(currentState[i] - currentState[i-1]);
                }
                lastElements.push(newState[newState.length-1]);
                currentState = newState;
                newState = [];
            }
            const lastCoeffs = generateLastCoefficients(line);
            console.log(lastElements);
            console.log(lastCoeffs);
            console.log("------");
            let extrapolation = 0;
            for (let i = lastCoeffs.length-1; i--; i >= 0) {
                extrapolation = lastCoeffs[i] + extrapolation;
            }
            result += extrapolation;
        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .extractAllNumbers(true)
            .run();
            let result = 0;
        for (const line of ns) {
            let currentState = [...line];
            const firstElements = [currentState[0]];
            let newState = [];
            while (currentState.length > 1 && currentState.some(e => e !== 0)) {
                for (let i = 1; i < currentState.length; i++) {
                    newState.push(currentState[i] - currentState[i-1]);
                }
                firstElements.push(newState[0]);
                currentState = newState;
                newState = [];
            }
            let extrapolation = 0;
            for (let i = firstElements.length-1; i--; i >= 0) {
                extrapolation = firstElements[i] - extrapolation;
            }
            result += extrapolation;
        }
        await resultOutputCallback(result);
    },
    {
        key: "mirage-maintenance",
        title: "Mirage Maintenance",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 9,
        stars: 2,
        exampleInput: `0 3 6 9 12 15
1 3 6 10 15 21
10 13 16 21 30 45`
    }
);