import { entryForFile } from "../../../entry";


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

type Packet = (OperatorPacket | LiteralPacket);

const isLiteral = (e: Packet): e is LiteralPacket => {
    return e.id === 4;
};

const toNumber = (bits: Bits): number => {
    return parseInt(bits.join(""), 2);
};

const parseHeader = (bits: Bits, start: number): { version: number; id: number; start: number } => {
    const version = toNumber(bits.slice(start, start + 3));
    start += 3;
    const id = toNumber(bits.slice(start, start + 3));
    start += 3;
    return { version, id, start };
};

const parseInput = (bits: Bits, start: number): [Packet, number] => {
    // const version = toNumber(bits.slice(start, start + 3));
    // start += 3;
    // const id = toNumber(bits.slice(start, start + 3));
    // start += 3;
    const header = parseHeader(bits, start);
    start = header.start;
    const { version, id } = header;
    if (id === 4) {
        const rawValue: Bits = [];
        let done = false;
        while (!done) {
            const group = bits.slice(start, start + 5);
            if (group[0] === 0) {
                done = true;
            }
            group.slice(1).forEach((b) => rawValue.push(b));
            start += 5;
        }
        const value = toNumber(rawValue);
        return [{
            version,
            id,
            value
        }, start];
    } else {
        const lengthType = bits[start];
        start++;
        const packets: Packet[] = [];
        if (lengthType === 0) {
            const length = toNumber(bits.slice(start, start + 15));
            start += 15;
            const targetStart = start + length;
            while (start < targetStart) {
                const [packet, newStart] = parseInput(bits, start);
                start = newStart;
                packets.push(packet);
            }
            if (start !== targetStart) {
                throw new Error("Start mismatch");
            }
        } else {
            const subs = toNumber(bits.slice(start, start + 11));
            start += 11;
            for (let i = 0; i < subs; i++) {
                const [packet, newStart] = parseInput(bits, start);
                start = newStart;
                packets.push(packet);
            }
        }
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
        // console.log(packet);
        return packet.version;
    } else {
        return packet.version + packet.sub.reduce((acc, next) => acc + countVersions(next), 0);
    }
};
const calculate = (packet: Packet): number => {
    if (isLiteral(packet)) {
        return packet.value;
    } else {
        if (packet.id === 0) {
            // sum
            return packet.sub.slice(1).reduce((acc, next) => acc + calculate(next), calculate(packet.sub[0]));
        } else if (packet.id === 1) {
            // prod
            return packet.sub.slice(1).reduce((acc, next) => acc * calculate(next), calculate(packet.sub[0]));
        } else if (packet.id === 2) {
            // min
            let min = Number.POSITIVE_INFINITY;
            for (const p of packet.sub) {
                const v = calculate(p);
                if (v < min) {
                    min = v;
                }
            }
            return min;
        } else if (packet.id === 3) {
            // max
            let max = Number.NEGATIVE_INFINITY;
            for (const p of packet.sub) {
                const v = calculate(p);
                if (v > max) {
                    max = v;
                }
            }
            return max;
        } else if (packet.id === 5) {
            if (packet.sub.length !== 2) {
                throw new Error("invalid length");
            }
            const [a, b] = packet.sub.map(calculate);
            if (a > b) {
                return 1;
            }
            return 0;
        } else if (packet.id === 6) {
            if (packet.sub.length !== 2) {
                throw new Error("invalid length");
            }
            const [a, b] = packet.sub.map(calculate);
            if (a < b) {
                return 1;
            }
            return 0;
        } else if (packet.id === 6) {
            // less than
            if (packet.sub.length !== 2) {
                throw new Error("invalid length");
            }
            const [a, b] = packet.sub.map(calculate);
            if (a < b) {
                return 1;
            }
            return 0;
        } else if (packet.id === 7) {
            // less than
            if (packet.sub.length !== 2) {
                throw new Error("invalid length");
            }
            const [a, b] = packet.sub.map(calculate);
            if (a === b) {
                return 1;
            }
            return 0;
        } else {
            throw new Error("Invalid packet");
        }
    }
};

export const packetDecoder = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const b: Array<0 | 1> = [];
        for (const c of lines[0]) {
            if (c) {
                const n = parseInt(c, 16);
                const bits = n.toString(2).padStart(4, "0");
                for (const x of bits) {
                    b.push(parseInt(x, 2) as 0 | 1);
                }
            }
        }
        const [packet] = parseInput(b, 0);

        // console.log(JSON.stringify(packet, null, 2));

        await resultOutputCallback(countVersions(packet));
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const b: Array<0 | 1> = [];
        for (const c of lines[0]) {
            if (c) {
                const n = parseInt(c, 16);
                const bits = n.toString(2).padStart(4, "0");
                for (const x of bits) {
                    b.push(parseInt(x, 2) as 0 | 1);
                }
            }
        }
        const [packet] = parseInput(b, 0);

        await resultOutputCallback(calculate(packet));
    },
    {
        key: "packet-decoder",
        title: "Packet Decoder",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);
