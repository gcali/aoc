import { ScratchCard } from ".";
import { MessageSender, Pause } from "../../../entry";

export interface IScratchCardsMessageSender {
    setup(numberOfCards: number): Promise<void>;
    setupCard(card: ScratchCard): Promise<void>;
    sendMatches(matches: number[]): Promise<void>;
}
export const buildCommunicator = (
        messageSender: MessageSender | undefined,
        pause: Pause
    ): IScratchCardsMessageSender => {
    if (!messageSender) {
        return new DummyMessageSender();
    } else {
        return new RealMessageSender(messageSender, pause);
    }
};

type Cell = {
    id: number;
    value: number;
}

export type CommunicatorScratchCard = {
    id: number;
    score: string;
    win: Cell[];
    mine: Cell[];
}

type PrivateScratchCardsMessage = {
    type: "SendCard",
    card: CommunicatorScratchCard,
    isSlow: boolean
} | {
    type: "MoveSelector",
    id: number
} | {
    type: "SelectWin",
    mineId: number,
    winId: number
} | {
    type: "SendScore",
    score: string
};

export type ScratchCardsMessage = {kind: "ScratchCardsMessage"} & PrivateScratchCardsMessage;

const buildMessage = (message: PrivateScratchCardsMessage): ScratchCardsMessage => {
    return {
        ...message,
        kind: "ScratchCardsMessage"
    };
};

export function isScratchCardsMessage(message: any): message is ScratchCardsMessage {
    return (message as ScratchCardsMessage).kind === "ScratchCardsMessage";
}

const slowCards = 5;

class RealMessageSender implements IScratchCardsMessageSender {
    private card: ScratchCard | undefined;
    private numberOfCards: number = 0;
    private howManyCards = 0;
    constructor(private readonly messageSender: MessageSender, private readonly pause: Pause) { }

    async setup(numberOfCards: number): Promise<void> {
        this.numberOfCards = numberOfCards;
        this.howManyCards = 0;
    }

    async setupCard(card: ScratchCard): Promise<void> {
        if (this.howManyCards < 10 || this.howManyCards > this.numberOfCards - 10) {

        this.card = card;
        await this.messageSender(buildMessage({
            type: "SendCard",
            card: {
                id: card.id,
                mine: card.mine.map((e, i) => ({
                    id: i,
                    value: e
                })),
                win: card.win.map((e, i) => ({
                    id: i,
                    value: e
                })),
                score: "0"
            },
            isSlow: this.isSlow()
        }));
        await this.pause();
        } else {
            this.card = undefined;
        }
        this.howManyCards++;
    }

    private isSlow() {
        const isSlow = this.howManyCards < slowCards || (this.howManyCards > this.numberOfCards - slowCards);
        return isSlow;
    }
    async sendMatches(matches: number[]): Promise<void> {
        if (this.card === undefined) {
            return;
        }
        let howManyMatches = 0;
        for (let i = 0; i < this.card.mine.length; i++) {
            const value = this.card.mine[i];
            await this.messageSender(buildMessage({
                type: "MoveSelector",
                id: i
            }));
            if (matches.includes(value)) {
                howManyMatches++;
                const winId = this.card.win.indexOf(value);
                await this.messageSender(buildMessage({
                    type: "SelectWin",
                    mineId: i,
                    winId: winId
                }));
                const score = (2 ** (howManyMatches-1)).toString();
                await this.messageSender(buildMessage({
                    type: "SendScore",
                    score
                }));
            }
        }
        if (this.isSlow()) {
            await this.pause(5);
        } else {
            await this.pause();
        }
    }

}

class DummyMessageSender implements IScratchCardsMessageSender {
    async setupCard(card: ScratchCard): Promise<void> { }
    async sendMatches(matches: number[]): Promise<void> { }
    async setup(numberOfCards: number): Promise<void> {}
}