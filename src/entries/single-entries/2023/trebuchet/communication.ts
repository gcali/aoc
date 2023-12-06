import { MessageSender, Pause } from "../../../entry";

export interface ITrebuchetMessageSender {
    setup(lines: string[], digitInfo: DigitInfo[][]): Promise<void>;
    // activate(line: number): Promise<void>;
}

type DigitInfo = {
    key: string;
    value: number;
    index: number;
}
export const buildCommunicator = (
        messageSender: MessageSender | undefined,
        pause: Pause
    ): ITrebuchetMessageSender => {
    if (!messageSender) {
        return new DummyMessageSender();
    } else {
        return new RealMessageSender(messageSender, pause);
    }
};


type PrivateTrebuchetMessage = {
    type: "setup",
    lines: TokenInfo[][]
} | {
    type: "activate",
    selected: number
};

export type TrebuchetMessage = {kind: "TrebuchetMessage"} & PrivateTrebuchetMessage;

const buildMessage = (message: PrivateTrebuchetMessage): TrebuchetMessage => {
    return {
        ...message,
        kind: "TrebuchetMessage"
    };
};

type TokenInfo = {
    token: string;
    isValid: boolean;
    isSelected: boolean;
}

export function isTrebuchetMessage(message: any): message is TrebuchetMessage {
    return (message as TrebuchetMessage).kind === "TrebuchetMessage";
}

class RealMessageSender implements ITrebuchetMessageSender {
    constructor(private readonly messageSender: MessageSender, private readonly pause: Pause) { 

    }
    async setup(lines: string[], digitInfo: DigitInfo[][]): Promise<void> {
        console.log(lines);
        await this.messageSender(buildMessage({
            type: "setup",
            lines: lines.map((line, index) => {
                const tokens: TokenInfo[] = [];
                const info = digitInfo[index];
                if (!info) {
                    throw new Error("Could not find info for line " + index);
                }
                let i = 0;
                // let currentToken = [];
                while (i < line.length) {
                    const [matchingDigit] = info.filter(d => d.index >= i);
                    if (!matchingDigit) {
                        tokens.push({token: line.slice(i), isValid: false, isSelected: false});
                        i = line.length;
                    } else {
                        if (matchingDigit.index !== i) {
                            tokens.push({token: line.slice(i, matchingDigit.index), isValid: false, isSelected: false});
                        }
                        tokens.push({token: matchingDigit.key, isValid: true, isSelected: false});
                        i = matchingDigit.index + matchingDigit.key.length;
                    }
                }
                console.log(tokens);
                const validTokens = tokens.filter(t => t.isValid);
                validTokens[0].isSelected = true;
                validTokens[validTokens.length-1].isSelected = true;
                return tokens;
            })
        }));

        await this.pause();

        for (let i = 0; i < lines.length; i++) {
            await this.messageSender(buildMessage({
                type: "activate",
                selected: i
            }));
            await this.pause();
        };
    }
    // async activate(line: number): Promise<void> {
    //     await this.messageSender(buildMessage({
    //         type: "activate",
    //         selected: line
    //     }));
    //     await this.pause();
    // }

}

class DummyMessageSender implements ITrebuchetMessageSender {
    async setup(lines: string[], digitInfo: DigitInfo[][]): Promise<void> { }
    async activate(line: number): Promise<void> { }
}