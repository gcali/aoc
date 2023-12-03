import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";

type Extraction = {
    cube: Cube;
    amount: number;
}


const cubes = ["red", "green", "blue"] as const;

type Cube = typeof cubes[number];

export const cubeConundrum = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const parsed = new Parser(lines)
            .tokenize(": ")
            .startLabeling()
            .label(game => game.n(), "id")
            .label(rounds => 
                rounds.tokenize("; ").tokenize(", ").mapTokens(
                    extraction => extraction.tokenize(" ").startLabeling()
                        .label(amount => amount.n(), "amount")
                        .label(cube => cube.s() as Cube, "cube"))
            , "rounds")
            .run();
        const games = parsed;

        const limits: Record<typeof cubes[number], number> = {
            "red": 12,
            "green": 13,
            "blue": 14
        };

        let result = 0;
        for (const game of games) {
            let hasRunOver = false;
            for (const round of game.rounds) {
                const currentLimit = {...limits};
                for (const extraction of round) {
                    currentLimit[extraction.cube] -= extraction.amount;
                }
                if (Object.values(currentLimit).some(e => e < 0)) {
                    hasRunOver = true;
                    break;
                }
            }
            if (!hasRunOver) {
                result += game.id;
            }
        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const games = new Parser(lines)
            .tokenize(": ")
            .startLabeling()
            .label(game => game.n(), "id")
            .label(rounds =>
                rounds
                    .tokenize("; ")
                    .tokenize(", ")
                    .mapTokens(tokens => 
                        tokens
                            .tokenize(" ")
                            .startLabeling()
                            .label(amount => amount.n(), "amount")
                            .label(cube => cube.s(), "cube")
                    )
                , "games"
            )
            .run();
        let result = 0;
        for (const game of games) {
            const amount: {[key: string]: number} = {};
            for (const round of game.games) {
                const counter: {[key: string]: number} = {};
                for (const extraction of round) {
                    counter[extraction.cube] = (counter[extraction.cube] || 0) + extraction.amount;
                }
                for (const cube of cubes) {
                    amount[cube] = Math.max(amount[cube] || 0, counter[cube] || 0);
                }
            }
            const power = cubes.reduce((acc, next) => acc * (amount[next] || 0), 1);
            result += power;
        }
        await resultOutputCallback(result);
    },
    {
        key: "cube-conundrum",
        title: "Cube Conundrum",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 2,
        stars: 2,
        exampleInput: `Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green`
    }
);