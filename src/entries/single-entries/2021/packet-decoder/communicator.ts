import { isLiteral, Packet } from ".";
import { MessageSender, Pause } from "../../../entry";
import { buildGraphCommunicator, Edge, IGraphCommunicatorMessageSender, Node } from "../../../graphCommunication";

export interface IPacketDecoderMessageSender {
    showPacketTreeVersions(packet: Packet): Promise<void>;
    showPacketTreeFull(packet: Packet): Promise<void>;
}
export const buildCommunicator = (
    messageSender: MessageSender | undefined,
    pause: Pause
): IPacketDecoderMessageSender => {
    if (!messageSender) {
        return new DummyMessageSender();
    } else {
        return new RealMessageSender(messageSender);
    }
};


type PrivatePacketDecoderMessage = {
};

export type PacketDecoderMessage = { kind: "PacketDecoderMessage" } & PrivatePacketDecoderMessage;

const buildMessage = (message: PrivatePacketDecoderMessage): PacketDecoderMessage => {
    return {
        ...message,
        kind: "PacketDecoderMessage"
    };
};

export function isPacketDecoderMessage(message: any): message is PacketDecoderMessage {
    return (message as PacketDecoderMessage).kind === "PacketDecoderMessage";
}

const visit = (
    packet: Packet,
    startId: number,
    colorGenerator: (packet: Packet) => string
): { nodes: Node[], edges: Edge[]; startId: number; rootId: number } => {
    const rootId = startId++;
    const nodes: Node[] = [{
        id: rootId,
        color: colorGenerator(packet),
        label: packet.version.toString()
    }];
    const edges: Edge[] = [];
    if (isLiteral(packet)) {
        return { nodes, edges, startId, rootId };
    }

    for (const sub of packet.sub) {
        const visitResult = visit(sub, startId, colorGenerator);
        const { nodes: subNodes, edges: subEdges, rootId: subRoot } = visitResult;
        let { startId: subStart } = visitResult;
        startId = subStart;
        edges.push({
            color: "white",
            from: rootId,
            to: subRoot,
            id: subStart++
        });
        startId = subStart;
        subNodes.forEach((n) => nodes.push(n));
        subEdges.forEach((s) => edges.push(s));
    }

    return {
        edges,
        nodes,
        rootId,
        startId
    };

};

class RealMessageSender implements IPacketDecoderMessageSender {
    private readonly graphCommunicator: IGraphCommunicatorMessageSender;
    constructor(messageSender: MessageSender) {
        this.graphCommunicator = buildGraphCommunicator(messageSender);
    }
    public async showPacketTreeVersions(packet: Packet): Promise<void> {
        await this.graphCommunicator.send({
            type: "title",
            title: "Warning: the graph WILL take a long while to load"
        });
        const { nodes, edges } = visit(packet, 0, (p) => {
            if (isLiteral(p)) {
                return "green";
            }
            return "white";
        });
        await this.graphCommunicator.send({
            edges,
            nodes,
            type: "setup"
        });
    }
    public async showPacketTreeFull(packet: Packet): Promise<void> {
        await this.graphCommunicator.send({
            type: "title",
            title: "Warning: the graph WILL take a long while to load"
        });
        const { nodes, edges } = visit(packet, 0, (p) => {
            switch (p.id) {
                case 0:
                    return "red";
                case 1:
                    return "pink";
                case 2:
                    return "blue";
                case 3:
                    return "purple";
                case 4:
                    return "green";
                case 5:
                    return "orange";
                case 6:
                    return "yellow";
                case 7:
                    return "khaki";
                default:
                    throw new Error("Unexpected");
            }
        });
        await this.graphCommunicator.send({
            edges,
            nodes,
            type: "setup"
        });
    }

}

class DummyMessageSender implements IPacketDecoderMessageSender {
    public async showPacketTreeVersions(packet: Packet): Promise<void> { }
    public async showPacketTreeFull(packet: Packet): Promise<void> { }
}
