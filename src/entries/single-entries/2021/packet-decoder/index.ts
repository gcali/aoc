import { entryForFile } from "../../../entry";
import { buildCommunicator } from "./communicator";


type Bit = 0 | 1;
type Bits = Bit[];

type BasePacket = {
    version: number;
};

type LiteralPacket = BasePacket & {
    id: 4;
    value: number;
};

type OperatorPacket = BasePacket & {
    id: number;
    sub: Packet[];
};

export type Packet = (OperatorPacket | LiteralPacket);

export const isLiteral = (e: Packet): e is LiteralPacket => {
    return e.id === 4;
};

const toNumber = (bits: Bits, start: number, to: number): number => {
    const res = [];
    for (let i = start; i < to; i++) {
        res.push(bits[i]);
    }
    return parseInt(res.join(""), 2);
};

const parseHeader = (bits: Bits, start: number): { version: number; id: number; newStart: number } => {
    const version = toNumber(bits, start, start + 3);
    start += 3;
    const id = toNumber(bits, start, start + 3);
    start += 3;
    return { version, id, newStart: start };
};

const parseOperator = (bits: Bits, start: number) => {
    const lengthType = bits[start];
    start++;
    const packets: Packet[] = [];
    if (lengthType === 0) {
        const length = toNumber(bits, start, start + 15);
        start += 15;
        const targetStart = start + length;
        while (start < targetStart) {
            const [packet, newStart] = createPacket(bits, start);
            start = newStart;
            packets.push(packet);
        }
        if (start !== targetStart) {
            throw new Error("Start mismatch");
        }
    } else {
        const subs = toNumber(bits, start, start + 11);
        start += 11;
        for (let i = 0; i < subs; i++) {
            const [packet, newStart] = createPacket(bits, start);
            start = newStart;
            packets.push(packet);
        }
    }
    return { packets, start };
};

const parseLiteral = (bits: Bits, start: number) => {
    const rawValue: Bits = [];
    let done = false;
    while (!done) {
        const group = bits.slice(start, start + 5);
        if (bits[start] === 0) {
            done = true;
        }
        for (let i = start + 1; i < start + 5; i++) {
            rawValue.push(bits[i]);
        }
        start += 5;
    }
    const value = toNumber(rawValue, 0, rawValue.length);
    return { value, start };
};


const createPacket = (bits: Bits, start: number): [Packet, number] => {
    const { version, id, newStart } = parseHeader(bits, start);
    start = newStart;
    if (id === 4) {
        let value;
        ({ value, start } = parseLiteral(bits, start));
        return [{
            version,
            id,
            value
        } as Packet, start];
    } else {
        let packets: Packet[];
        ({ packets, start } = parseOperator(bits, start));
        return [
            {
                version,
                id,
                sub: packets
            },
            start
        ];
    }
};

const countVersions = (packet: Packet): number => {
    if (isLiteral(packet)) {
        return packet.version;
    } else {
        return packet.version + packet.sub.reduce((acc, next) => acc + countVersions(next), 0);
    }
};
const calculate = (packet: Packet): number => {
    if (isLiteral(packet)) {
        return packet.value;
    } else {
        const subs = packet.sub.map(calculate);
        if (packet.id === 0) {
            return subs.reduce((acc, next) => acc + next);
        } else if (packet.id === 1) {
            return subs.reduce((acc, next) => acc * next);
        } else if (packet.id === 2) {
            return Math.min(...subs);
        } else if (packet.id === 3) {
            return Math.max(...subs);
        } else {
            // all the rest are binary operations
            if (subs.length !== 2) {
                throw new Error("invalid length");
            }
            const [a, b] = subs;
            if (packet.id === 5) {
                return a > b ? 1 : 0;
            } else if (packet.id === 6) {
                return a < b ? 1 : 0;
            } else if (packet.id === 7) {
                return a === b ? 1 : 0;
            } else {
                throw new Error("Invalid packet");
            }
        }
    }
};

const parseInput = (lines: string[]): Bits => {
    const b: Bits = [];
    for (const c of lines[0]) {
        if (c) {
            const n = parseInt(c, 16);
            const bits = n.toString(2).padStart(4, "0");
            for (const x of bits) {
                b.push(parseInt(x, 2) as Bit);
            }
        }
    }
    return b;
};

export const packetDecoder = entryForFile(
    async ({ lines, resultOutputCallback, sendMessage, pause }) => {
        const bits = parseInput(lines);
        const [packet] = createPacket(bits, 0);

        const communicator = buildCommunicator(sendMessage, pause);

        await communicator.showPacketTreeVersions(packet);

        await resultOutputCallback(countVersions(packet));
    },
    async ({ lines, resultOutputCallback, sendMessage, pause }) => {
        const bits = parseInput(lines);
        const [packet] = createPacket(bits, 0);
        const communicator = buildCommunicator(sendMessage, pause);

        await communicator.showPacketTreeFull(packet);

        await resultOutputCallback(calculate(packet));
    },
    {
        key: "packet-decoder",
        title: "Packet Decoder",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2,
        customComponent: "graph"
    }
);


