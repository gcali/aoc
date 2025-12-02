import { MessageSender, Pause } from "../../../entry";

export interface ISecretEntranceMessageSender {
    setRotationName(name: string): Promise<void>;
    rotate(rotation: number, isMatch: boolean): Promise<void>;
    init(): Promise<void>;

}
export const buildCommunicator = (
        messageSender: MessageSender | undefined,
        pause: Pause
    ): ISecretEntranceMessageSender => {
    if (!messageSender) {
        return new DummyMessageSender();
    } else {
        return new RealMessageSender(messageSender, pause);
    }
};


type PrivateSecretEntranceMessage = {
    type: "rotation";
    isMatch: boolean;
    rotation: number;
} | {
    type: "name";
    name: string;
} | {
    type: "init"
};

export type SecretEntranceMessage = {kind: "SecretEntranceMessage"} & PrivateSecretEntranceMessage;

const buildMessage = (message: PrivateSecretEntranceMessage): SecretEntranceMessage => {
    return {
        ...message,
        kind: "SecretEntranceMessage"
    };
};

export function isSecretEntranceMessage(message: any): message is SecretEntranceMessage {
    return (message as SecretEntranceMessage).kind === "SecretEntranceMessage";
}

class RealMessageSender implements ISecretEntranceMessageSender {
    constructor(private readonly messageSender: MessageSender, private readonly pause: Pause) { }

    async setRotationName(name: string) {
        await this.messageSender(buildMessage({
            "type": "name",
            name: name
        }))
        await this.pause();
    }
    async rotate(rotation: number, isMatch: boolean): Promise<void> {
        await this.messageSender(buildMessage({
            "type": "rotation",
            isMatch: isMatch,
            rotation: rotation
        }));

        await this.pause();
        if (isMatch) {
            await this.pause(10);
        }
    }

    async init(): Promise<void> {
        await this.messageSender(buildMessage({type: "init"}))
    }

}

class DummyMessageSender implements ISecretEntranceMessageSender {
    async setRotationName(name: string) {};
    async rotate(rotation: number, isMatch: boolean): Promise<void> {}
    async init(): Promise<void> {}
}