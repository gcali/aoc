import { entryForFile } from "../../../entry";
type State = {
    a: FullPlayerState,
    b: FullPlayerState,
};


type FullPlayerState = PlayerState & { missingRolls: number };

type Wins = {
    a: number;
    b: number;
};

type Cache = Map<string, Wins>;

const serialize = (s: State) => {
    return [
        s.a.score,
        s.b.score,
        s.a.space,
        s.b.space,
        s.a.missingRolls,
        s.b.missingRolls
    ].map((e) => e.toString()).join("|");
};

const clone = (s: State, update: (x: State) => void) => {
    const ns = {
        a: { ...s.a },
        b: { ...s.b }
    };
    update(ns);
    return ns;
};

const sumWins = (target: Wins, source: Wins): void => {
    target.a += source.a;
    target.b += source.b;
};

const findWinning = (s: State, cache: Cache): Wins => {
    if (s.a.score >= 21) {
        return {
            a: 1,
            b: 0
        };
    }

    if (s.b.score >= 21) {
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

    const playerToRoll: keyof State | null =
        s.a.missingRolls > 0 ? "a" :
            (s.b.missingRolls > 0 ? "b" : null);

    if (playerToRoll !== null) {
        for (let i = 1; i <= 3; i++) {
            sumWins(result, findWinning(clone(s, (e) => {
                const playerState = e[playerToRoll];
                playerState.missingRolls--;
                playerState.space += i;
                if (playerState.space > 10) {
                    playerState.space -= 10;
                }
                if (playerState.missingRolls === 0) {
                    playerState.score += playerState.space;
                }
            }), cache));
            cache.set(serialized, result);
        }
        return result;
    } else {
        return findWinning(clone(s, (e) => {
            e.a.missingRolls = 3;
            e.b.missingRolls = 3;
        }), cache);
    }

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
        const baseState: FullPlayerState = {
            score: 0,
            space: 0,
            missingRolls: 0
        };
        const res = findWinning({
            a: { ...baseState },
            b: { ...baseState }
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

