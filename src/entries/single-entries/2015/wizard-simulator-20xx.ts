import { entryForFile } from "../../entry";
import { Queue } from "../../../support/data-structure";
import { PriorityQueue } from "priorityqueue/lib/cjs/PriorityQueue";
import { PairingHeap } from "priorityqueue/lib/cjs";

interface State {
    hitPoints: number;
    damage: number;
}

interface Timers {
    shield: number;
    poison: number;
    recharge: number;
}

type PlayerState = State & Timers & { mana: number, spentMana: number };

type Spell = "missile" | "drain" | "shield" | "poison" | "recharge";

interface GameState {
    playerState: PlayerState;
    bossState: State;
}

const spellCost = (spell: Spell): number => {
    switch (spell) {
        case "drain":
            return 73;
        case "missile":
            return 53;
        case "poison":
            return 173;
        case "recharge":
            return 229;
        case "shield":
            return 113;
    }
};

const paySpell = (spell: Spell, state: PlayerState): PlayerState => {
    const cost = spellCost(spell);
    return {
        ...state,
        mana: state.mana - cost,
        spentMana: state.spentMana + cost
    };
};

const launchSpell = (spell: Spell, { playerState, bossState }: GameState): GameState => {
    playerState = paySpell(spell, playerState);
    switch (spell) {
        case "drain":
            return {
                playerState: {
                    ...playerState,
                    hitPoints: playerState.hitPoints + 2
                },
                bossState: {
                    ...bossState,
                    hitPoints: bossState.hitPoints - 2
                }
            };
        case "missile":
            return {
                playerState,
                bossState: {
                    ...bossState,
                    hitPoints: bossState.hitPoints - 4
                }
            };
        case "poison":
            return {
                playerState: {
                    ...playerState,
                    poison: 6
                },
                bossState
            };
        case "recharge":
            return {
                playerState: {
                    ...playerState,
                    recharge: 5
                },
                bossState
            };
        case "shield":
            return {
                playerState: {
                    ...playerState,
                    shield: 6
                },
                bossState
            };
    }
};

const parseState = (lines: string[]): State => {
    const [hitPoints, damage] = lines.map((l) => parseInt(l.split(": ")[1], 10));
    return { hitPoints, damage };
};

const applyEffects = ({ playerState, bossState }: GameState): GameState => {
    const newPlayerState = { ...playerState };
    const newBossState = { ...bossState };
    if (newPlayerState.poison > 0) {
        newPlayerState.poison--;
        newBossState.hitPoints -= 3;
    }
    if (newPlayerState.shield > 0) {
        newPlayerState.shield--;
    }
    if (newPlayerState.recharge > 0) {
        newPlayerState.mana += 101;
        newPlayerState.recharge--;
    }
    return { playerState: newPlayerState, bossState: newBossState };
};

const bossDamageTurn = ({ playerState, bossState }: GameState): GameState => {
    const damage = Math.max(bossState.damage - (playerState.shield > 0 ? 7 : 0), 1);
    return hurtPlayer({ playerState, bossState }, damage);
    // return {
    //     playerState: {
    //         ...playerState,
    //         hitPoints: playerState.hitPoints - damage
    //     },
    //     bossState
    // };
};

const hurtPlayer = ({ playerState, bossState }: GameState, damage: number): GameState => {
    return {
        playerState: {
            ...playerState,
            hitPoints: playerState.hitPoints - damage
        },
        bossState
    };
};

const spells: Spell[] = [
    "drain",
    "missile",
    "poison",
    "recharge",
    "shield"
];

const canLaunchSpell = (state: GameState, spell: Spell): boolean => {
    if (spellCost(spell) > state.playerState.mana) {
        return false;
    }
    switch (spell) {
        case "missile":
        case "drain":
            return true;
        case "poison":
            return state.playerState.poison === 0;
        case "recharge":
            return state.playerState.recharge === 0;
        case "shield":
            return state.playerState.shield === 0;
    }
};

type TurnResult = {
    hasWon: true,
    state: GameState
} | {
    hasWon: false,
    hasLost: true,
    state: GameState
} | {
    hasWon: false,
    hasLost: false,
    state: GameState
};

const playTurn = (spell: Spell, state: GameState, playerHpLoss: number = 0): TurnResult => {
    const current = state;
    const afterStart = playerHpLoss === 0 ? current : hurtPlayer(current, playerHpLoss);
    if (afterStart.playerState.hitPoints <= 0) {
        return { hasWon: false, hasLost: true, state: afterStart };
    }
    const afterEffects = applyEffects(afterStart);
    if (afterEffects.bossState.hitPoints <= 0) {
        return { hasWon: true, state: afterEffects };
    }
    if (!canLaunchSpell(afterEffects, spell)) {
        return { hasWon: false, hasLost: true, state: afterEffects };
    }
    const afterSpell = launchSpell(spell, afterEffects);
    if (afterSpell.playerState.mana < 0) {
        return { hasWon: false, hasLost: true, state: afterSpell };
    }
    if (afterSpell.bossState.hitPoints <= 0) {
        return { hasWon: true, state: afterSpell };
    }
    const afterSecondEffects = applyEffects(afterSpell);
    if (afterSecondEffects.bossState.hitPoints <= 0) {
        return { hasWon: true, state: afterSecondEffects };
    }
    const afterBoss = bossDamageTurn(afterSecondEffects);
    if (afterBoss.playerState.hitPoints <= 0) {
        return { hasWon: false, hasLost: true, state: afterBoss };
    }
    return { hasWon: false, hasLost: false, state: afterBoss };
};

const bfsPruned = (startGameState: GameState, hardMode: boolean): GameState | null => {
    const states = new Queue<GameState>();
    states.add(startGameState);
    let bestWinState: GameState | null = null;
    const updateBestState = (state: GameState) => {
        if (bestWinState === null || bestWinState.playerState.spentMana > state.playerState.spentMana) {
            bestWinState = state;
        }
    };
    while (!states.isEmpty) {
        const current = states.get()!;
        if (bestWinState !== null) {
            const cast = bestWinState as GameState;
            if (cast.playerState.spentMana < current.playerState.spentMana) {
                continue;
            }
        }
        spells.forEach((spell) => {
            const result = playTurn(spell, current, hardMode ? 1 : 0);
            if (result.hasWon) {
                updateBestState(result.state);
            } else if (result.hasLost) {
                return;
            } else {
                states.add(result.state);
            }
            // const afterEffects = applyEffects(current);
            // if (afterEffects.bossState.hitPoints <= 0) {
            //     updateBestState(afterEffects);
            // }
            // if (!canLaunchSpell(afterEffects, spell)) {
            //     return;
            // }
            // const afterSpell = launchSpell(spell, afterEffects);
            // if (afterSpell.playerState.mana < 0) {
            //     return;
            // }
            // if (afterSpell.bossState.hitPoints <= 0) {
            //     updateBestState(afterSpell);
            // }
            // const afterSecondEffects = applyEffects(afterSpell);
            // if (afterSecondEffects.bossState.hitPoints <= 0) {
            //     updateBestState(afterSecondEffects);
            // }
            // const afterBoss = bossDamageTurn(afterSecondEffects);
            // if (afterBoss.playerState.hitPoints <= 0) {
            //     return;
            // }
            // if (bestBossHitpoints > afterBoss.bossState.hitPoints) {
            //     bestBossHitpoints = afterBoss.bossState.hitPoints;
            //     console.log(bestBossHitpoints);
            // }
            // states.add(afterBoss);
        });

    }
    return bestWinState;
};

const exploreFight = (startGameState: GameState): GameState | null => {
    // const queue = new WizardPriorityQueue();
    const queue = new PairingHeap<{ spell: Spell; gameState: GameState }>({
        comparator:
            (a, b) =>
                spellCost(b.spell) + b.gameState.playerState.spentMana -
                (spellCost(a.spell) + a.gameState.playerState.spentMana)
    });
    spells.forEach((spell) => {
        queue.push({ spell, gameState: startGameState });
    });
    while (!queue.isEmpty()) {
        const round = queue.pop();
        const afterEffects = applyEffects(round.gameState);
        if (afterEffects.bossState.hitPoints <= 0) {
            return afterEffects;
        }
        const afterSpell = launchSpell(round.spell, afterEffects);
        if (afterSpell.playerState.mana < 0) {
            continue;
        }
        if (afterSpell.bossState.hitPoints <= 0) {
            return afterSpell;
        }
        const afterSecondEffects = applyEffects(afterSpell);
        if (afterSecondEffects.bossState.hitPoints <= 0) {
            return afterSecondEffects;
        }
        const afterBoss = bossDamageTurn(afterSecondEffects);
        if (afterBoss.playerState.hitPoints <= 0) {
            continue;
        }
        const spellCandidates: Spell[] = [
            "missile",
            "drain"
        ];
        if (afterBoss.playerState.recharge === 0) {
            spellCandidates.push("recharge");
        }
        if (afterBoss.playerState.shield === 0) {
            spellCandidates.push("shield");
        }
        if (afterBoss.playerState.poison === 0) {
            spellCandidates.push("poison");
        }
        spellCandidates.forEach((spell) => {
            queue.push({ spell, gameState: afterBoss });
        });
    }
    return null;
};

const initGameState = (lines: string[]): GameState => {
    const bossState = parseState(lines);
    const playerState: PlayerState = {
        hitPoints: 50,
        mana: 500,
        damage: 0,
        poison: 0,
        recharge: 0,
        shield: 0,
        spentMana: 0
    };
    return { bossState, playerState };

};

export const wizardSimulator20xx = entryForFile(
    async ({ lines, outputCallback }) => {
        const gameState = initGameState(lines);
        const winner = bfsPruned(gameState, false);
        if (winner === null) {
            await outputCallback("No winner state found");
        } else {
            await outputCallback(winner);
        }
    },
    async ({ lines, outputCallback }) => {
        const gameState = initGameState(lines);
        const winner = bfsPruned(gameState, true);
        if (winner === null) {
            await outputCallback("No winner state found");
        } else {
            await outputCallback(winner);
        }
    },
    { key: "wizard-simulator-20xx", title: "Wizard Simulator 20XX", stars: 2, embeddedData: true}
);
