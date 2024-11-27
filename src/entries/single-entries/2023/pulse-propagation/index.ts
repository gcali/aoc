import { entryForFile } from "../../../entry";
import { DefaultDict, Queue } from "../../../../support/data-structure";
import { optimizeCycles } from "../../../../support/optimization";
import { lcm } from "../../../../support/algebra";

type Pulse = "low" | "high";
type State = "on" | "off";

type ModuleType = "%" | "&" | "broadcaster" | "button";

type PulseCounter = DefaultDict<Pulse, number>;

type Module = {
    id: string;
    inputs: string[];
    outputs: string[];
} & ({
    type: "%";
    memory: State;
} | {
    type: "&";
    memory: Pulse[];
} | {
    type: "broadcaster" | "button"
})

const getType = (left: string): ModuleType => {
    if (left[0] === "b") {
        return "broadcaster";
    } else if (left[0] === "%") {
        return "%";
    } else if (left[0] === "&") {
        return "&";
    } else {
        throw new Error("Invalid input");
    }
}

const parseLine = (line: string): Module => {
    const [left, right] = line.split(" -> ");
    const type = getType(left);
    const id = type === "broadcaster" ? type : left.slice(1);
    const outputs = right.split(", ");
    const inputs: string[] = [];
    if (type === "%") {
        return {
            id,
            inputs,
            outputs,
            type,
            memory: "off"
        }
    } else if (type === "&") {
        return {
            id,
            inputs,
            outputs,
            type,
            memory: []
        }
    } else {
        return {
            id,
            inputs,
            outputs,
            type
        }
    }
}

const handleInput = (destination: Module, from: string, pulse: Pulse): Array<{ destination: string, pulse: Pulse }> => {
    if (destination.type === "broadcaster") {
        return destination.outputs.map(output => ({
            destination: output,
            pulse
        }))
    } else if (destination.type === "%") {
        if (pulse === "high") {
            return [];
        } else {
            const destinationPulse = destination.memory === "off" ? "high" : "low";
            const destinationState = destination.memory === "off" ? "on" : "off";
            destination.memory = destinationState;
            return destination.outputs.map(output => ({
                destination: output,
                pulse: destinationPulse
            }))
        }
    } else if (destination.type === "&") {
        const index = destination.inputs.indexOf(from);
        if (index < 0) {
            throw new Error(`Invalid source for ${destination.id}: ${from}`);
        }
        destination.memory[index] = pulse;
        const destinationPulse = destination.memory.every(e => e === "high") ? "low" : "high";
        return destination.outputs.map(output => ({
            destination: output,
            pulse: destinationPulse
        }))
    } else {
        throw new Error("Invalid module type: " + destination.type);
    }
}

class Machines {
    private readonly lookup = new Map<string, Module>();
    private readonly pulses: PulseCounter[] = [];
    private readonly pulseTracking = new DefaultDict<string, number>(() => 0)

    private readonly pulsesToTrack: { id: string; pulse: Pulse }[] = [];

    constructor(lines: string[]) {
        for (const line of lines) {
            const module = parseLine(line.trim());
            this.lookup.set(module.id, module)
        }
        for (const module of this.lookup.values()) {
            for (const destinationKey of module.outputs) {
                const destinationModule = this.lookup.get(destinationKey);
                if (destinationModule) {
                    destinationModule.inputs.push(module.id);
                    if (destinationModule.type === "&") {
                        destinationModule.memory.push("low");
                    }
                }
            }
        }
    }

    public visitGraph(): string[] {
        const stack = new Queue<string>();
        stack.add("broadcaster");
        const visited = new Set<string>();
        const edges: string[] = [];
        while (!stack.isEmpty) {
            const currentNode = stack.get()!;
            if (visited.has(currentNode)) {
                continue;
            }
            visited.add(currentNode);
            const node = this.getModule(currentNode);
            if (!node) {
                continue;
            }
            const outputs = node.outputs;
            for (const output of outputs) {
                edges.push(`${currentNode} -> ${output}`);
                stack.add(output);
            }
        }
        return edges;
    }

    public state(): string {
        const interesting: string[] = [];
        for (const module of this.lookup.values()) {
            if (module.type === "%") {
                interesting.push(`${module.id}_${module.memory}`);
            } else if (module.type === "&") {
                interesting.push(`${module.id}_${module.memory.join(",")}`);
            }
        }
        return interesting.join("|");
    }

    public totalPulses(): [number, number] {
        const total = this.pulses.reduce((acc, next) => [next.get("high") + acc[0], next.get("low") + acc[1]] as [number, number], [0, 0] as [number, number]);
        return total;
    }

    private getModule(key: string): Module | null {
        const res = this.lookup.get(key);
        if (!res) {
            return null;
        }
        return res;
    }

    public startTrackingPulses(destination: string, pulse: Pulse) {
        this.pulsesToTrack.push({ id: destination, pulse });
    }

    public hasPulse(id: string): boolean {
        return this.pulseTracking.get(id) > 0;
    }

    public pushButton(): PulseCounter {
        const stack = new Queue<{ pulse: Pulse, id: string, source: string }>();
        stack.add({ id: "broadcaster", pulse: "low", source: "button" });
        const pulses = new DefaultDict<Pulse, number>(() => 0);
        while (!stack.isEmpty) {
            const { id, pulse, source } = stack.get()!;
            if (id === "rx" && pulse === "low") {
                console.log(pulse);
            }
            if (this.pulsesToTrack.some(e => e.id === id && e.pulse === pulse)) {
                this.pulseTracking.update(id, e => e + 1)
                console.log("Hi!");
            }
            pulses.update(pulse, x => x + 1);
            const module = this.getModule(id);
            if (!module) {
                continue;
            }
            const results = handleInput(module, source, pulse);
            for (const item of results) {
                stack.add({
                    pulse: item.pulse,
                    id: item.destination,
                    source: id
                });
            }
        }
        this.pulses.push(pulses);
        return pulses;
    }
}

export const pulsePropagation = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const machines = new Machines(lines);
        const { result, iteration, cycles, remainder } = optimizeCycles(
            machines,
            1000,
            e => e.state(),
            (machines) => {
                const pulses = machines.pushButton();
                const newPulses = machines.totalPulses();
                return [machines, newPulses];
            }
        )
        await resultOutputCallback(result[0] * cycles * result[1] * cycles);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const machines = new Machines(lines);
        const interestingPulses = [
            "sh", "jf", "bh", "mz"
        ]
        const values = new Map<string, number>();
        for (const x of interestingPulses) {
            machines.startTrackingPulses(x, "low");
        }
        let i = 0;
        while (values.size !== interestingPulses.length) {
            machines.pushButton();
            i++;
            for (const x of interestingPulses) {
                if ((!values.has(x)) && machines.hasPulse(x)) {
                    values.set(x, i);
                }
            }
        }

        const periods = values.values();

        const result = lcm(...periods)
        await resultOutputCallback(result);

        // await resultOutputCallback(machines.visitGraph().join("\n"));
        // let i = 0;
        // machines.startTrackingPulses("rx", "low");
        // while (!machines.hasPulse("rx")) {
        //     machines.pushButton();
        //     i++;
        // }
        // await resultOutputCallback(i);
    },
    {
        key: "pulse-propagation",
        title: "Pulse Propagation",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 20,
        // exampleInput: `broadcaster -> a, b, c
        // %a -> b
        // %b -> c
        // %c -> inv
        // &inv -> a`
        exampleInput: `broadcaster -> a
        %a -> inv, con
        &inv -> b
        %b -> con
        &con -> output`
    }
);