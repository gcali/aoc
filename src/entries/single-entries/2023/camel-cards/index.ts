import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";


const handOrder = [
    "Five",
    "Four",
    "FullHouse",
    "Three",
    "TwoPair",
    "OnePair",
    "High"
] as const;

type HandType = typeof handOrder[number];

const cardOrder = [ "A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2" ];

type Card = typeof cardOrder[number];

const jokerCardOrder: Card[] = [ "A", "K", "Q", "T", "9", "8", "7", "6", "5", "4", "3", "2", "J" ];


type Hand = {
    cards: Card[];
    bid: number;
}

const getHandType = (hand: Hand | Card[]): HandType => {
    const cards = Array.isArray(hand) ? hand : hand.cards;
    const counter = cards.reduce((acc, next) => {
        acc[next] = (acc[next] || 0) + 1;
        return acc;
    }, {} as Record<string, number>)
    const counts = Object.values(counter);
    if (counts.some(c => c === 5)) {
        return "Five";
    } else if (counts.some(c => c === 4)) {
        return "Four";
    } else if (counts.some(c => c === 3) && counts.some(c => c === 2)) {
        return "FullHouse";
    } else if (counts.some(c => c === 3)) {
        return "Three";
    } else if (counts.filter(c => c === 2).length === 2) {
        return "TwoPair";
    } else if (counts.some(c => c === 2)) {
        return "OnePair";
    } else {
        return "High";
    }
}

const getCardIndex = (card: Card, order: Card[]) => {
    return order.indexOf(card);
}

const getHandIndex = (hand: Hand | Card[]): number => 
    handOrder.indexOf(getHandType(hand));

const compareHands = (a: Hand, b: Hand): number => {
    const typeComparison = getHandIndex(b) - getHandIndex(a);
    if (typeComparison !== 0) {
        return typeComparison;
    }
    for (let i = 0; i < a.cards.length; i++) {
        const cardComparison = getCardIndex(b.cards[i], cardOrder) - getCardIndex(a.cards[i], cardOrder);
        if (cardComparison !== 0) {
            return cardComparison;
        }
    }
    return 0;
}

const generateFromJokers = (hand: Hand): Card[][] => {
    const cleanHand = hand.cards.filter(e => e !== "J");
    const howManyJokers = hand.cards.filter(e => e === "J").length;
    if (howManyJokers === 0) {
        return [hand.cards];
    } else {
        let currentHands = [cleanHand];
        for (let i = 0; i < howManyJokers; i++) {
            const newHands = [];
            for (const card of cardOrder) {
                for (const hand of currentHands) {
                    if (card !== "J") {
                        newHands.push([...hand, card]);
                    }
                }
            }
            currentHands = newHands;
        }
        return currentHands;
    }

}

const getBestIndex = (a: Hand) => {
    let bestA = Number.POSITIVE_INFINITY;
    for (const candidateA of generateFromJokers(a)) {
        bestA = Math.min(getHandIndex(candidateA), bestA);
    }
    return bestA;
}

const compareHandsWithJoker = (a: Hand, b: Hand): number => {
    const aIndex = getBestIndex(a);
    const bIndex = getBestIndex(b);
    const typeComparison = bIndex - aIndex;
    if (typeComparison !== 0) {
        return typeComparison;
    }
    for (let i = 0; i < a.cards.length; i++) {
        const cardComparison = getCardIndex(b.cards[i], jokerCardOrder) - getCardIndex(a.cards[i], jokerCardOrder);
        if (cardComparison !== 0) {
            return cardComparison;
        }
    }
    return 0;
}


export const camelCards = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const cards = parseInput(lines)
            .sort((a, b) => compareHands(a, b));
        const result = calculateScore(cards);
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const cards = parseInput(lines)
            .sort((a, b) => compareHandsWithJoker(a, b));
        const result = calculateScore(cards);
        await resultOutputCallback(result);
    },
    {
        key: "camel-cards",
        title: "Camel Cards",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 7,
        stars: 2,
        exampleInput: `32T3K 765
T55J5 684
KK677 28
KTJJT 220
QQQJA 483`
    }
);

const parseInput = (lines: string[]) => {
    return new Parser(lines)
        .tokenize(" ")
        .startLabeling()
        .label(e => e.tokenize("").run() as Card[], "cards")
        .label(e => e.n(), "bid")
        .run();
}

const calculateScore = (cards: ({ bid: number; } & { cards: string[]; })[]) => {
    return cards.map((c, i) => ({ c, i })).reduce((acc, next) => {
        return acc + next.c.bid * (next.i + 1);
    }, 0);
}

