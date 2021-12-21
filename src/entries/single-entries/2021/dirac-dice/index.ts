import { entryForFile } from "../../../entry";

type State = {
    a: number;
    b: number;
    aS: number;
    bS: number;
    missingRolls: {
        a: number;
        b: number;
    }
};

type Wins = {
    a: number;
    b: number;
};

type Cache = Map<string, Wins>;

const serialize = (s: State) => {
    return [
        s.a,
        s.b,
        s.aS,
        s.bS,
        s.missingRolls.a,
        s.missingRolls.b
    ].map((e) => e.toString()).join("|");
};

const clone = (s: State, update: (x: State) => void) => {
    const ns = {
        ...s,
        missingRolls: {
            ...s.missingRolls
        }
    };
    update(ns);
    return ns;
};

const sumWins = (target: Wins, source: Wins): void => {
    target.a += source.a;
    target.b += source.b;
};

const findWinning = (s: State, cache: Cache): Wins => {
    if (s.a >= 21) {
        return {
            a: 1,
            b: 0
        };
    }

    if (s.b >= 21) {
        return {
            a: 0,
            b: 1
        };
    }

    const serialized = serialize(s);
    if (cache.has(serialized)) {
        return cache.get(serialized)!;
    }

    const result: Wins = {
        a: 0,
        b: 0
    };

    if (s.missingRolls.a > 0) {
        for (let i = 1; i <= 3; i++) {
            sumWins(result, findWinning(clone(s, (e) => {
                e.missingRolls.a--;
                e.aS += i;
                if (e.aS > 10) {
                    e.aS -= 10;
                }
                if (e.missingRolls.a === 0) {
                    e.a += e.aS;
                }
            }), cache));
            cache.set(serialized, result);
        }
        return result;
    }

    if (s.missingRolls.b > 0) {
        for (let i = 1; i <= 3; i++) {
            sumWins(result, findWinning(clone(s, (e) => {
                e.missingRolls.b--;
                e.bS += i;
                if (e.bS > 10) {
                    e.bS -= 10;
                }
                if (e.missingRolls.b === 0) {
                    e.b += e.bS;
                }
            }), cache));
            cache.set(serialized, result);
        }
        return result;
    }

    return findWinning(clone(s, (e) => {
        e.missingRolls.a = 3;
        e.missingRolls.b = 3;
    }), cache);
};

type PlayerState = {
    score: number;
    space: number;
};

const parseInput = (lines: string[]): {
    a: PlayerState,
    b: PlayerState
} => {
    const [aSpace, bSpace] = lines.map((l) => {
        const tk = l.split(" ");
        return parseInt(tk[tk.length - 1], 10);
    });
    return {
        a: {
            space: aSpace,
            score: 0
        },
        b: {
            space: bSpace,
            score: 0
        }
    };
};

export const diracDice = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const { a, b } = parseInput(lines);
        const state = {
            die: 1,
            rolls: 0
        };
        while (true) {
            for (const { player, other } of [{ player: a, other: b }, { player: b, other: a }]) {
                playTurn(player, state);
                if (player.score >= 1000) {
                    await resultOutputCallback(state.rolls * other.score);
                    return;
                }
            }
        }
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const [aS, bS] = lines.map((l) => {
            const tk = l.split(" ");
            return parseInt(tk[tk.length - 1], 10);
        });
        const res = findWinning({
            a: 0,
            b: 0,
            aS,
            bS,
            missingRolls: {
                a: 0,
                b: 0
            }
        }, new Map<string, Wins>());

        await resultOutputCallback(Math.max(res.a, res.b));
    },
    {
        key: "dirac-dice",
        title: "Dirac Dice",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);

function playTurn(player: PlayerState, state: { die: number; rolls: number; }) {
    for (let i = 0; i < 3; i++) {
        player.space += state.die;
        state.die++;
        if (state.die > 100) {
            state.die -= 100;
        }
        state.rolls++;
    }


    player.space = ((player.space - 1) % 10) + 1;
    player.score += player.space;
}

