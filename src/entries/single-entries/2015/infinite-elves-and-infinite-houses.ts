import { entryForFile } from "../../entry";
const {primalityTest} = require("primality-test");

const isProbablyPrime = async (e: number, rounds?: number): Promise<boolean> => {
    const res = rounds !== undefined ? (await primalityTest(e, {numRounds: rounds})) : await primalityTest(e);
    return res.probablePrime;
}


const findExponent = (n: number, divisor: number): number => {
    let i = 0;
    while (n % divisor === 0) {
        i++;
        n /= divisor;
    }
    return i;
};

const primeFactors = async (n: number): Promise<Array<{ prime: number, exponent: number }>> => {
    if (n === 0) {
        throw new Error("Zero is out of range");
    }
    const primeWithEsponents: Array<{ prime: number, exponent: number }> = [];
    if (n % 2 === 0) {
        const exponent = findExponent(n, 2);
        primeWithEsponents.push({
            prime: 2,
            exponent
        });
        n /= (2 ** exponent);
    }
    if (await isProbablyPrime(n)) {
        primeWithEsponents.push({
            prime: n,
            exponent: 1
        });
    } else if (n !== 1) {
        const max = Math.floor(Math.sqrt(n));
        for (let i = 3; i <= max; i += 2) {
            if (n % i === 0 && await isProbablyPrime(i, 40)) {
                const exponent = findExponent(n, i);
                if (n % (i ** exponent) !== 0) {
                    throw new Error(JSON.stringify({ i, exponent }));
                }
                if (n % (i ** (exponent + 1)) === 0) {
                    throw new Error(JSON.stringify({ i, exponent, next: true }));
                }
                primeWithEsponents.push({
                    prime: i,
                    exponent
                });
            }
        }
    }
    return primeWithEsponents;
};

const divisorSum = async (n: number): Promise<number> => {
    const factors = await primeFactors(n);
    return factors
        .reduce((acc, next) => acc * geometric(next.prime, next.exponent), 1);
};

const geometric = (r: number, exponent: number): number => {
    return (r ** (exponent + 1) - 1) / (r - 1);
};

export const infiniteElvesAndInfiniteHouses = entryForFile(
    async ({ lines, outputCallback }) => {
        const target = parseInt(lines[0], 10);
        const flatData: number[] = new Array(Math.ceil(target / 10)).fill(0);
        for (let i = 1; i < flatData.length; i++) {
            if (i % 10000 === 0) {
                await outputCallback(null);
                await outputCallback(`${i * 100 / flatData.length}%`);
            }
            for (let j = 1; j <= flatData.length / i; j++) {
                flatData[i * j - 1] += i * 10;
            }
        }
        for (let i = 0; i < flatData.length; i++) {
            if (flatData[i] >= target) {
                await outputCallback("House " + (i + 1));
                return;
            }
        }
    },
    async ({ lines, outputCallback }) => {
        const target = parseInt(lines[0], 10);
        const flatData: number[] = new Array(Math.ceil(target)).fill(0);
        for (let i = 1; i < flatData.length; i++) {
            if (i % 10000 === 0) {
                await outputCallback(null);
                await outputCallback(`${i * 100 / flatData.length}%`);
            }
            for (let j = 1; j <= Math.min(flatData.length / i, 50); j++) {
                flatData[i * j - 1] += i * 11;
            }
        }
        for (let i = 0; i < flatData.length; i++) {
            if (flatData[i] >= target) {
                await outputCallback("House " + (i + 1));
                return;
            }
        }
    },
    { key: "infinite-elves-and-infinite-houses", title: "Infinite Elves and Infinite Houses", stars: 2 }
);
