import "mocha";
//import { shuffleDeck, Deck, findNumberAtPosition, getCoefficients, CoefficientCalculator } from "../slam-shuffle";
import { expectSameArrays } from "../../../../support/assertions";
import { expect } from "chai";

const baseInput: string[] = [
    "deal into new stack",
    "cut -2",
    "deal with increment 7",
    "cut 8",
    "cut -4",
    "deal with increment 7",
    "cut 3",
    "deal with increment 9",
    "deal with increment 3",
    "cut -1"
];

// describe("Slam Shuffle", () => {
//     it("should shuffle dek correctly", () => {
//         const deck = new Deck(10);
//         shuffleDeck(baseInput, deck);
//         const res = deck.sort().map((e) => BigInt(e.card));
//         expectSameArrays([9n, 2n, 5n, 8n, 1n, 4n, 7n, 0n, 3n, 6n], res);
//     });

//     it("should revert single shuffle", async () => {
//         const deck = new Deck(10);
//         shuffleDeck(baseInput, deck);
//         const shuffled = deck.sort().map((e) => BigInt(e.card));
//         for (let i = 0; i < shuffled.length; i++) {
//             const value = await findNumberAtPosition(baseInput, 10, i, 1);
//             expect(value).to.equal(shuffled[i], `Iteration ${i}, `);
//         }
//     });

//     it("should revert double shuffle", async () => {
//         const deck = new Deck(10);
//         shuffleDeck(baseInput, deck);
//         shuffleDeck(baseInput, deck);
//         const shuffled = deck.sort().map((e) => BigInt(e.card));
//         for (let i = 0; i < shuffled.length; i++) {
//             const value = await findNumberAtPosition(baseInput, 10, i, 2);
//             expect(value).to.equal(shuffled[i], "Iteration: " + i);
//         }
//     });

//     it("should revert 100 shuffles", async () => {
//         const deck = new Deck(10);
//         for (let i = 0 ; i < 100; i++) {
//             shuffleDeck(baseInput, deck);
//         }
//         const shuffled = deck.sort().map((e) => BigInt(e.card));
//         for (let i = 0; i < shuffled.length; i++) {
//             const value = await findNumberAtPosition(baseInput, 10, i, 100);
//             expect(value).to.equal(shuffled[i], "Iteration " + i);
//         }
//     });

//     it("should revert 10000 shuffles", async () => {
//         const deck = new Deck(10);
//         for (let i = 0 ; i < 10000; i++) {
//             shuffleDeck(baseInput, deck);
//         }
//         const shuffled = deck.sort().map((e) => BigInt(e.card));
//         for (let i = 0; i < shuffled.length; i++) {
//             const value = await findNumberAtPosition(baseInput, 10, i, 10000);
//             expect(value).to.equal(shuffled[i], "Iteration " + i);
//         }
//     });

//     it("should revert 1000 shuffles of prime deck", async () => {
//         const size = 97;
//         const shuffles = 1000;
//         const deck = new Deck(size);
//         for (let i = 0 ; i < shuffles; i++) {
//             shuffleDeck(baseInput, deck);
//         }
//         const shuffled = deck.sort().map((e) => BigInt(e.card));
//         for (let i = 0; i < shuffled.length; i++) {
//             const value = await findNumberAtPosition(baseInput, size, i, shuffles);
//             expect(value).to.equal(shuffled[i], "Iteration " + i);
//         }
//     });

//     it("should have different results for different starting values (detailed)", async () => {
//         const reversedInput = [...input].reverse();

//         const firstValue =  32761079407091n;
//         const secondValue = 106185565740205n;
//         const size = 119315717514047;

//         const firstDeck = new Deck(size, [firstValue]);
//         firstDeck.shouldReverse = true;
//         const secondDeck = new Deck(size, [secondValue]);
//         secondDeck.shouldReverse = true;

//         for (const line of reversedInput) {
//             shuffleDeck([line], firstDeck);
//             shuffleDeck([line], secondDeck);
//             expect(firstDeck.positions[0]).not.to.equal(secondDeck.positions[0]);
//         }
//     });

//     it("should have different results for different starting values with deal with increment", async () => {
//         const firstValue =  53980726970434n;
//         const secondValue = 88598163376194n;
//         const size = 119315717514047;

//         const firstDeck = new Deck(size, [firstValue]);
//         firstDeck.shouldReverse = true;
//         const secondDeck = new Deck(size, [secondValue]);
//         secondDeck.shouldReverse = true;

//         firstDeck.increment(65);
//         secondDeck.increment(65);

//         expect(firstDeck.positions[0]).to.not.equal(secondDeck.positions[0]);

//     });

//     it("should have same result with shuffle and coefficients", async () => {
//         const deck = new Deck(10);

//         shuffleDeck(baseInput, deck);
//         const coefficients = getCoefficients(baseInput, 10n);
//         for (let i = 0; i < 10; i++) {
//             expect(deck.positions[i]).to.equal(coefficients.applyTo(BigInt(i)));
//         }
//     });

//     it("should have same result with shuffle and coefficients (big)", async () => {
//         const size = 119315717514047n;
//         const values = [2019n, 2020n];

//         const deck = new Deck(size, [...values]);

//         shuffleDeck(input, deck);
//         const coefficients = getCoefficients(input, size);
//         for (let i = 0; i < values.length; i++) {
//             const res = coefficients.applyTo(values[i]);
//             try {
//                 expect(deck.positions[i]).to.equal(res);
//             } catch (e) {
//                 expect.fail(`Failure on iteration ${i}: ${deck.positions[i]} - ${res}`);
//             }
//         }
//     });

//     it("should calculate right coefficients for pow 1", () => {
//         const size = 10n;
//         const iterative = getCoefficients(baseInput, size);

//         const calculated = getCoefficients(baseInput, size);
//         calculated.pow(1n);

//         expect(iterative.coefficients.a.toString()).to.equal(calculated.coefficients.a.toString());
//         expect(iterative.coefficients.b.toString()).to.equal(calculated.coefficients.b.toString());
//     });

//     it("should calculate right coefficients for pow 2", () => {
//         const size = 10n;
//         let iterative = getCoefficients(baseInput, size);
//         iterative = getCoefficients(baseInput, size, iterative.coefficients);

//         const calculated = getCoefficients(baseInput, size);
//         calculated.pow(2n);

//         expect(iterative.coefficients.a.toString()).to.equal(calculated.coefficients.a.toString());
//         expect(iterative.coefficients.b.toString()).to.equal(calculated.coefficients.b.toString());
//     });

//     it("should calculate right coefficients for pow 10", () => {
//         const size = 10n;
//         const p = 10n;
//         let iterative = getCoefficients(baseInput, size);
//         for (let i = 1n; i < p; i++) {
//             iterative = getCoefficients(baseInput, size, iterative.coefficients);
//         }

//         const calculated = getCoefficients(baseInput, size);
//         calculated.pow(p);

//         expect(iterative.coefficients.a.toString()).to.equal(calculated.coefficients.a.toString());
//         expect(iterative.coefficients.b.toString()).to.equal(calculated.coefficients.b.toString());
//     });

//     it("should calculate right value for pow 10", () => {
//         const size = 10n;
//         const p = 10n;
//         const calculated = getCoefficients(baseInput, size);
//         calculated.pow(p);

//         const deck = new Deck(size, [3n]);
//         for (let i = 0; i < size; i++) {
//             shuffleDeck(baseInput, deck);
//         }

//         const manualValue = deck.positions[0];

//         const calculatedValue = calculated.applyTo(3n);

//         expect(calculatedValue).to.equal(manualValue);


//     });

// });

// const input = [
//     "deal with increment 54",
//     "cut -667",
//     "deal with increment 15",
//     "cut -1826",
//     "deal with increment 55",
//     "cut -8444",
//     "deal with increment 44",
//     "cut 910",
//     "deal with increment 63",
//     "cut 4025",
//     "deal with increment 45",
//     "cut 6430",
//     "deal with increment 53",
//     "cut -3727",
//     "deal into new stack",
//     "deal with increment 6",
//     "cut -5464",
//     "deal into new stack",
//     "deal with increment 48",
//     "cut 6238",
//     "deal with increment 23",
//     "cut 8614",
//     "deal with increment 50",
//     "cut -987",
//     "deal with increment 26",
//     "cut -9808",
//     "deal with increment 47",
//     "cut -8088",
//     "deal with increment 5",
//     "deal into new stack",
//     "cut 5787",
//     "deal with increment 49",
//     "cut 795",
//     "deal with increment 2",
//     "cut -536",
//     "deal with increment 26",
//     "deal into new stack",
//     "cut -6327",
//     "deal with increment 63",
//     "cut 2511",
//     "deal with increment 38",
//     "cut -2622",
//     "deal into new stack",
//     "deal with increment 9",
//     "cut 8201",
//     "deal into new stack",
//     "deal with increment 48",
//     "cut -2470",
//     "deal with increment 19",
//     "cut 8669",
//     "deal into new stack",
//     "deal with increment 28",
//     "cut -2723",
//     "deal into new stack",
//     "deal with increment 15",
//     "cut -5101",
//     "deal into new stack",
//     "cut 464",
//     "deal with increment 68",
//     "cut 2695",
//     "deal with increment 53",
//     "cut -8523",
//     "deal with increment 32",
//     "cut -1018",
//     "deal with increment 66",
//     "cut 9127",
//     "deal with increment 3",
//     "deal into new stack",
//     "deal with increment 14",
//     "cut 725",
//     "deal into new stack",
//     "cut -2273",
//     "deal with increment 65",
//     "cut 6306",
//     "deal with increment 55",
//     "cut -6710",
//     "deal with increment 54",
//     "cut 7814",
//     "deal with increment 23",
//     "cut 8877",
//     "deal with increment 60",
//     "cut 3063",
//     "deal with increment 40",
//     "cut -2104",
//     "deal with increment 72",
//     "cut -4171",
//     "deal with increment 21",
//     "cut 7919",
//     "deal with increment 53",
//     "cut -3320",
//     "deal with increment 49",
//     "deal into new stack",
//     "cut -8201",
//     "deal into new stack",
//     "deal with increment 54",
//     "deal into new stack",
//     "cut 6321",
//     "deal with increment 50",
//     "cut 7244",
//     "deal with increment 23"
// ];
