import { entryForFile, simpleOutputCallbackFactory } from "../../entry";
import { modInverse, pow } from "../../../support/algebra";

interface Coefficients {
    a: bigint;
    b: bigint;
}

export class CoefficientCalculator {
    public coefficients: Coefficients;
    constructor(
        private size: bigint,
        coefficients?: Coefficients
    ) {
        if (!coefficients) {
            this.coefficients = {
                a: 1n,
                b: 0n
            };
        } else {
            this.coefficients = coefficients;
        }
    }
    public deal(): CoefficientCalculator {
        const newCoefficients = {
            a: (this.size - this.coefficients.a) % this.size,
            b: (this.size - this.coefficients.b - 1n) % this.size
        };
        this.coefficients = newCoefficients;
        return this;
    }

    public cut(n: bigint): CoefficientCalculator {
        const newCoefficients = {
            a: this.coefficients.a,
            b: (this.size + this.coefficients.b - n) % this.size
        };
        this.coefficients = newCoefficients;
        return this;
    }

    public increment(n: bigint): CoefficientCalculator {
        const newCoefficients = {
            a: (this.coefficients.a * n) % this.size,
            b: (this.coefficients.b * n) % this.size
        };
        this.coefficients = newCoefficients;
        return this;
    }

    public applyTo(x: bigint): bigint {
        return ((this.coefficients.a * x + this.coefficients.b) % this.size + this.size) % this.size;
    }

    public pow(n: bigint): CoefficientCalculator {
        const factor = this.coefficients;
        const an = pow(factor.a, n, this.size);
        const b = factor.a === 1n ? (factor.b * n) : (factor.b * ((an - 1n) / (factor.a - 1n)));
        this.coefficients = {
            a: an,
            b: b % this.size
        };
        return this;
    }

    public invert(): CoefficientCalculator {
        const aInverted = modInverse(this.coefficients.a, this.size);
        this.coefficients = {
            a: aInverted,
            b: -(aInverted * this.coefficients.b)
        };
        return this;
    }
}

export const getCoefficients = (
    lines: string[],
    size: bigint,
    startCoefficients?: Coefficients
): CoefficientCalculator => {
    const coefficientCalculator = new CoefficientCalculator(size, startCoefficients);
    lines.forEach((line) => {
        if (line.indexOf("deal into new stack") >= 0) {
            coefficientCalculator.deal();
        } else {
            const tokens = line.split(" ");
            const n = BigInt(parseInt(tokens[tokens.length - 1], 10));
            if (line.indexOf("increment") >= 0) {
                coefficientCalculator.increment(n);
            } else if (line.indexOf("cut") >= 0) {
                coefficientCalculator.cut(n);
            } else {
                throw new Error("Could not parse " + line);
            }
        }
    });
    return coefficientCalculator;
};


export class Deck {
    public positions: Array<bigint>;

    public shouldReverse: boolean = false;

    private readonly size: bigint;

    constructor(
        size: bigint | number,
        positions?: Array<bigint>
    ) {
        this.size = BigInt(size);
        if (positions) {
            this.positions = positions;
        } else {
            this.positions = [...Array(size)].map((e, i) => BigInt(i));
        }
    }

    public deal(): Deck {
        const length = BigInt(this.size);
        for (let i = 0; i < this.positions.length; i++) {
            this.positions[i] = length - this.positions[i] - 1n;
        }
        return this;
    }

    public cut(n: number): Deck {
        const length = this.size;
        if (this.shouldReverse) {
            n *= -1;
        }
        for (let i = 0; i < this.positions.length; i++) {
            this.positions[i] = (this.positions[i] - BigInt(n) + length) % length;
        }
        return this;
    }

    public increment(n: number): Deck {
        const length = this.size;
        const factor = this.shouldReverse ? modInverse(BigInt(n), length) : BigInt(n);
        for (let i = 0; i < this.positions.length; i++) {
            this.positions[i] = (this.positions[i] * factor) % length;
        }
        return this;
    }

    public sort(): Array<{ card: (number | bigint), index: (number | bigint) }> {
        return this.positions
            .map((e, i) => ({ e, i }))
            .sort((a, b) => Number(a.e - b.e))
            .map((e) => ({ card: e.i, index: e.e }));
    }

}

export const shuffleDeck = (lines: string[], deck: Deck): void => {
    lines.forEach((line) => {
        if (line.indexOf("deal into new stack") >= 0) {
            deck.deal();
        } else {
            const tokens = line.split(" ");
            const n = parseInt(tokens[tokens.length - 1], 10);
            if (line.indexOf("increment") >= 0) {
                deck.increment(n);
            } else if (line.indexOf("cut") >= 0) {
                deck.cut(n);
            } else {
                throw new Error("Could not parse " + line);
            }
        }
    });
};

export const findNumberAtPosition = async (
    input: string[],
    size: number,
    position: number,
    times: number,
    debug?: (s: string) => Promise<void>
): Promise<number | bigint> => {
    const reversedInput = [...input].reverse();
    const deck = new Deck(size, [BigInt(position)]);
    deck.shouldReverse = true;
    const cache = new Map<bigint, number>();
    const history: Array<bigint> = [];
    for (let i = 0; i < times; i++) {
        if (debug && i > 0 && i % 10000 === 0) {
            await debug(`Iteration ${i / 1000}k`);
        }
        const e = deck.positions[0];
        const hit = cache.get(e);
        if (hit !== undefined) {
            if (hit !== 0) {
                throw new Error("How the hell did this happen?");
            }
            const loopSize = i - hit;
            const remaining = times - i;
            const delta = remaining % loopSize;
            const index = hit + delta;
            return history[index];
        }
        history.push(e);
        cache.set(e, i);
        shuffleDeck(reversedInput, deck);
    }
    return deck.positions[0];
};

export const slamShuffle = entryForFile(
    async ({ lines, outputCallback }) => {
        const size = 10007n;
        const coeff = getCoefficients(lines, size);
        const res = coeff.applyTo(2019n);
        await outputCallback(res);
        const newCoeff = getCoefficients(lines, size);
        newCoeff.invert();
        await outputCallback(newCoeff.applyTo(res));
    },
    async ({ lines, outputCallback }) => {
        const size = 119315717514047n;
        const times = 101741582076661n;

        const coeff = getCoefficients(lines, size);
        coeff.pow(times);
        coeff.invert();
        const value = coeff.applyTo(2020n);
        await outputCallback(value);

        const checkCoeff = getCoefficients(lines, size);
        checkCoeff.pow(times);
        const inv = checkCoeff.applyTo(value);
        await outputCallback(inv);
    },
    { key: "slam-shuffle", title: "Slam Shuffle", stars: 1, embeddedData: true }
);
