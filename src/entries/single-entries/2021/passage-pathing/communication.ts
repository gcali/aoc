import mediaQuery from "../../../../support/browser/mediaQuery";
import { MessageSender, Pause } from "../../../entry";

export interface IPassagePathingMessageSender {
    setup(edges: Array<{from: string; to: string; }>): Promise<void>;
    current(node: string): Promise<void>;
    queue(node: string): Promise<void>;
    visited(node: string): Promise<void>;
}
export const buildCommunicator = (
    messageSender: MessageSender | undefined,
    pause: Pause
): IPassagePathingMessageSender => {
    if (!messageSender) {
        return new DummyMessageSender();
    } else {
        return new RealMessageSender(messageSender, pause);
    }
};


type PrivatePassagePathingMessage = {
    type: "setup";
    nodes: Array<{id: number; label: string}>;
    edges: Array<{ from: number; to: number; }>;
    animateCallback: (shouldAnimate: boolean) => void;
} | {
    type: "current";
    node: number;
} | {
    type: "queue";
    node: number;
} | {
    type: "visited";
    node: number;
};

export type PassagePathingMessage = { kind: "PassagePathingMessage" } & PrivatePassagePathingMessage;

const buildMessage = (message: PrivatePassagePathingMessage): PassagePathingMessage => {
    return {
        ...message,
        kind: "PassagePathingMessage"
    };
};

export function isPassagePathingMessage(message: any): message is PassagePathingMessage {
    return (message as PassagePathingMessage).kind === "PassagePathingMessage";
}

class RealMessageSender implements IPassagePathingMessageSender {
    private readonly nodeQueueCount: {[key: string]: number} = {};
    private readonly nodes: {[key: string]: number} = {};
    private shouldAnimate = false;
    constructor(private readonly messageSender: MessageSender, private readonly pause: Pause) { }

    public async setup(edges: Array<{from: string; to: string; }>): Promise<void> {
        const ns = new Set<string>();
        for (const edge of edges) {
            ns.add(edge.from);
            ns.add(edge.to);
        }
        const nodes = [...ns];
        let id = 0;
        for (const node of nodes) {
            this.nodeQueueCount[node] = 0;
            this.nodes[node] = id++;
        }
        await this.messageSender(buildMessage({
                type: "setup",
                edges: edges.map((e) => ({
                    from: this.nodes[e.from],
                    to: this.nodes[e.to]
                })),
                nodes: nodes.map((n) => ({
                    id: this.nodes[n],
                    label: n
                })),
                animateCallback: (should) => this.shouldAnimate = should
        }));
    }

    public async queue(node: string): Promise<void> {
        if (this.shouldAnimate) {
            const current = this.nodeQueueCount[node]++;
            if (current > 0) {
                await this.messageSender(buildMessage({
                        type: "queue",
                        node: this.nodes[node]
                }));
            }
            await this.pause();
        }
    }

    public async visited(node: string): Promise<void> {
        if (this.shouldAnimate) {
            const current = --this.nodeQueueCount[node];
            if (current <= 0) {
                await this.messageSender(buildMessage({
                    type: "visited",
                    node: this.nodes[node]
                }));
            } else {
                await this.messageSender(buildMessage({
                    type: "queue",
                    node: this.nodes[node]
                }));
            }
        }
    }

    public async current(node: string): Promise<void> {
        if (this.shouldAnimate) {
            await this.messageSender(buildMessage({
                type: "current",
                node: this.nodes[node]
            }));
        }
    }

}

class DummyMessageSender implements IPassagePathingMessageSender {
    public async queue(node: string): Promise<void> {
    }
    public async visited(node: string): Promise<void> {
    }
    public async current(node: string): Promise<void> {
    }
    public async setup(edges: Array<{ from: string; to: string; }>): Promise<void> {
    }
}
