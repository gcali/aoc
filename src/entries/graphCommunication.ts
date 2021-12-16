import { MessageSender, Pause } from "./entry";

export interface IGraphCommunicatorMessageSender {
    send(message: PrivateGraphCommunicatorMessage): Promise<void>;
}
export const buildGraphCommunicator = (
    messageSender: MessageSender | undefined
): IGraphCommunicatorMessageSender => {
    if (!messageSender) {
        return new DummyMessageSender();
    } else {
        return new RealMessageSender(messageSender);
    }
};


export type Node = {
    id: number;
    label: string;
    color: string;
};

export type Edge = {
    id: number;
    from: number;
    to: number;
    color: string;
};

export type PrivateGraphCommunicatorMessage = {
    type: "setup";
    nodes: Node[];
    edges: Edge[];
} | {
    type: "add-node";
    node: Node;
} | {
    type: "add-edge";
    edge: Edge;
} | {
    type: "remove-node";
    id: number;
} | {
    type: "remove-edge";
    id: number;
} | {
    type: "change-node-color";
    id: number;
    color: string;
} | {
    type: "change-edge-color";
    id: number;
    color: string;
} | {
    type: "title";
    title: string;
};

export type GraphCommunicatorMessage = { kind: "GraphCommunicatorMessage" } & PrivateGraphCommunicatorMessage;

const buildMessage = (message: PrivateGraphCommunicatorMessage): GraphCommunicatorMessage => {
    return {
        ...message,
        kind: "GraphCommunicatorMessage"
    };
};

export function isGraphCommunicatorMessage(message: any): message is GraphCommunicatorMessage {
    return (message as GraphCommunicatorMessage).kind === "GraphCommunicatorMessage";
}

class RealMessageSender implements IGraphCommunicatorMessageSender {
    constructor(private readonly messageSender: MessageSender) { }
    public send(message: PrivateGraphCommunicatorMessage): Promise<void> {
        return this.messageSender(buildMessage(message));
    }

}

class DummyMessageSender implements IGraphCommunicatorMessageSender {
    public async send(message: PrivateGraphCommunicatorMessage): Promise<void> {
    }
}
