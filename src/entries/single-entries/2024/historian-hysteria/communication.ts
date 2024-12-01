import { DefaultDict } from "../../../../support/data-structure";
import { MessageSender, Pause } from "../../../entry";

export interface IHistorianHysteriaMessageSender {
    sendPair(pair: [number, number], delta: number): Promise<void> | void;
    sendLookup(lookup: DefaultDict<number, number>): Promise<void> | void;
    sendLookableEntry(entry: number): Promise<void> | void;
}
export const buildCommunicator = (
        messageSender: MessageSender | undefined,
        pause: Pause
    ): IHistorianHysteriaMessageSender => {
    if (!messageSender) {
        return new DummyMessageSender();
    } else {
        return new RealMessageSender(messageSender, pause);
    }
};


type PrivateHistorianHysteriaMessage = {
    type: "NewPairEntry";
    pair: [number, number];
    delta: number
} | {
    type: "SetupLookup",
    lookupEntries: {amount: number, value: number}[]
} | {
    type: "SendLookableEntry",
    entry: number
};

export type HistorianHysteriaMessage = {kind: "HistorianHysteriaMessage"} & PrivateHistorianHysteriaMessage;

const buildMessage = (message: PrivateHistorianHysteriaMessage): HistorianHysteriaMessage => {
    return {
        ...message,
        kind: "HistorianHysteriaMessage"
    };
};

export function isHistorianHysteriaMessage(message: any): message is HistorianHysteriaMessage {
    return (message as HistorianHysteriaMessage).kind === "HistorianHysteriaMessage";
}

class RealMessageSender implements IHistorianHysteriaMessageSender {
    constructor(private readonly messageSender: MessageSender, private readonly pause: Pause) { }
    private counter = 0;
    async sendPair(pair: [number, number], delta: number): Promise<void> {
        const message = buildMessage({
            type: "NewPairEntry",
            pair,
            delta
        });
        await this.messageSender(message);
    }

    private lookable: Set<number> = new Set<number>();

    async sendLookup(lookup: DefaultDict<number, number>): Promise<void> {
        const message = buildMessage({
            type: "SetupLookup",
            lookupEntries: [...lookup.keys].map(k => ({value: k, amount: lookup.get(k)}))
        })
        this.lookable = new Set<number>(lookup.keys);
        await this.messageSender(message);
    }

    async sendLookableEntry(entry: number): Promise<void> {
        const message = buildMessage({
            type: "SendLookableEntry",
            entry
        })
        await this.messageSender(message);
        if (this.lookable.has(entry)) {
            if (this.counter < 10) {
                await this.pause(100);
            }
            this.counter++;
        }
        await this.pause(1);
    }

}

class DummyMessageSender implements IHistorianHysteriaMessageSender {
    sendLookableEntry(entry: number): void {
    }
    sendPair(pair: [number, number], delta: number) {
    }
    sendLookup(lookup: DefaultDict<number, number>) {
    }
}