import { setTimeoutAsync } from "../../../../support/async";
import { MessageSender, Pause } from "../../../entry";

export interface IMullItOverMessageSender {
    sendCode(data: string): void | Promise<void>;
    sendMatch(match: Match): void | Promise<void>;
    sendResult(result: number): void | Promise<void>;
    sendEnabled(enabled: boolean): void | Promise<void>;
}
export const buildCommunicator = (
        messageSender: MessageSender | undefined,
        pause: Pause
    ): IMullItOverMessageSender => {
    if (!messageSender) {
        return new DummyMessageSender();
    } else {
        return new RealMessageSender(messageSender, pause);
    }
};


export type Match = {
    index: number;
    length: number;
}

type PrivateMullItOverMessage = {
    type: "code";
    data: string;
} | {
    type: "match";
    match: Match;
} | {
    type: "result";
    result: number;
} | {
    type: "enabled";
    enabled: boolean;
};

export type MullItOverMessage = {kind: "MullItOverMessage"} & PrivateMullItOverMessage;

const buildMessage = (message: PrivateMullItOverMessage): MullItOverMessage => {
    return {
        ...message,
        kind: "MullItOverMessage"
    };
};

export function isMullItOverMessage(message: any): message is MullItOverMessage {
    return (message as MullItOverMessage).kind === "MullItOverMessage";
}

class RealMessageSender implements IMullItOverMessageSender {
    constructor(private readonly messageSender: MessageSender, private readonly pause: Pause) { }
    async sendCode(data: string): Promise<void> {
        await this.messageSender(buildMessage({
            type: "code",
            data
        }));
        await this.pause(1);
    }
    async sendMatch(match: Match): Promise<void> {
        await this.messageSender(buildMessage({
            type: "match",
            match
        }));
        await setTimeoutAsync(0);
        // await this.pause(0);
    }
    async sendResult(result: number): Promise<void> {
        await this.messageSender(buildMessage({
            type: "result",
            result
        }));
        await setTimeoutAsync(0);
    }
    async sendEnabled(enabled: boolean): Promise<void> {
        await this.messageSender(buildMessage({
            type: "enabled",
            enabled
        }));
        await this.pause(1);
    }

}

class DummyMessageSender implements IMullItOverMessageSender {
    sendCode(data: string): void | Promise<void> {
    }
    sendMatch(match: Match): void | Promise<void> {
    }
    sendResult(result: number): void | Promise<void> {
    }
    sendEnabled(enabled: boolean): void | Promise<void> {
    }
}