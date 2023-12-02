import { voidIsPromise } from "./async";

export type Memory = number[];

type ParameterMode = "Position" | "Immediate" | "Relative";
interface Operation {
    code: number;
    parameterModes: ParameterMode[];
    parameters: number;
}

const parameterMap: { [key: number]: number } = {
    1: 3,
    2: 3,
    3: 1,
    4: 1,
    5: 2,
    6: 2,
    7: 3,
    8: 3,
    9: 1
};

function parseOperation(op: number): Operation {
    const code = op % 100;
    const parameters = parameterMap[code];
    let modes = Math.floor(op / 100);
    const parameterModes: ParameterMode[] = [];
    while (modes > 0) {
        if (modes % 10 === 0) {
            parameterModes.push("Position");
        } else if (modes % 10 === 1) {
            parameterModes.push("Immediate");
        } else if (modes % 10 === 2) {
            parameterModes.push("Relative");
        }
        modes = Math.floor(modes / 10);
    }
    let missing = parameters - parameterModes.length;
    while (missing > 0) {
        parameterModes.push("Position");
        missing--;
    }
    return {
        code,
        parameterModes,
        parameters
    };
}

async function executeInstruction(
    pointer: number,
    memory: Memory,
    input: () => Promise<number>,
    output: (x: number) => void,
    data: Data
): Promise<[number, Memory]> {
    const copy = [...memory];
    const op = getMemoryAddress(memory, pointer);
    const operation = parseOperation(op);
    if (operationExecutorMap[operation.code]) {
        let newPointer = await operationExecutorMap[operation.code](operation, pointer, copy, input, output, data);
        if (!newPointer && newPointer !== 0) {
            newPointer = pointer + operation.parameters + 1;
        }
        return [newPointer, copy];
    } else {
        throw Error("Operation not valid: " + operation.code);
    }
}

export function inputGenerator(inputList: number[]) {
    let i = 0;
    return async () => {
        if (i > inputList.length) {
            throw new Error("Input is empty");
        }
        return inputList[i++];
    };
}

interface Data {
    relativeBase: number;
}

function memoryDump(memory: Memory, address: number): string {
    return memory.map((cell, index) => {
        if (index === address) {
            return `->${cell}`;
        } else {
            return cell ? cell.toString() : "0";
        }
    }).map((cell, index) => (index % 10 === 0) ? `${index}: ${cell}` : cell).join(" | ");
}

interface ExecutionArgs {
    memory: Memory;
    input: () => Promise<number>;
    output: (x: number) => void;
    close?: () => void | Promise<void>;
    data?: Data;
    debug?: (e: any) => Promise<void>;
    next?: () => Promise<void>;
}

export async function execute({ memory, input, output, close, data, debug, next }: ExecutionArgs): Promise<Memory> {
    if (!data) {
        data = {
            relativeBase: 0
        };
    }
    let instructionPointer = 0;
    if (debug) {
        await debug(memoryDump(memory, instructionPointer));
    }
    while ((getMemoryAddress(memory, instructionPointer) % 100) !== 99) {
        try {
            [instructionPointer, memory] = await executeInstruction(instructionPointer, memory, input, output, data);
            if (next) {
                await next();
            }
        } catch (e) {
            if (isStopExecution(e)) {
                break;
            }
            throw e;
        }
        if (debug) {
            await debug(memoryDump(memory, instructionPointer));
        }
    }
    if (close) {
        const closeResult = close();
        if (voidIsPromise(closeResult)) {
            await closeResult;
        }
    }
    return memory;
}

class StopExecution extends Error {
    public readonly flag = "IS_STOP_EXECUTION";
}

function isStopExecution(e: unknown): e is StopExecution {
    return (e as StopExecution).flag === "IS_STOP_EXECUTION";
}

export function stopExecution() {
    throw new StopExecution();
}

export function parseMemory(line: string): Memory {
    const memory = line.split(",").map((e) => parseInt(e, 10));
    return memory;
}

function getMemoryAddress(memory: Memory, address: number): number {
    if (address < 0) {
        throw new InterpreterError("Address out of range", "NegativeAddress");
    }
    const value = memory[address];
    if (!value) {
        return 0;
    } else {
        return value;
    }
}

function getParameter(address: number, memory: Memory, parameterMode: ParameterMode, data: Data): number {
    switch (parameterMode) {
        case "Position":
            return getMemoryAddress(memory, getMemoryAddress(memory, address));
        case "Immediate":
            return getMemoryAddress(memory, address);
        case "Relative":
            return getMemoryAddress(memory, getMemoryAddress(memory, address) + data.relativeBase);

    }
}

type ErrorCode = "NegativeAddress" | "WriteError";

export class InterpreterError extends Error {
    public readonly errorType: string;
    // public readonly errorCode: ErrorCode;
    constructor(message: string, public readonly errorCode: ErrorCode) {
        super(message);
        this.errorType = "InterpreterError";

    }
}

export function isInterpretedError(e: Error): e is InterpreterError {
    if ((e as InterpreterError).errorType === "InterpreterError") {
        return true;
    }
    return false;
}

type OperationExecutor = (
    operation: Operation,
    instructionPointer: number,
    memory: Memory,
    input: () => Promise<number>,
    output: (x: number) => void | Promise<void>,
    data: Data
) => Promise<number | void>;

function getOperationParameter(n: number, address: number, memory: Memory, operation: Operation, data: Data) {
    return getParameter(address + n, memory, operation.parameterModes[n - 1], data);
}

function getParameters(address: number, memory: Memory, operation: Operation, data: Data): number[] {
    const params = [];
    for (let i = 0; i < operation.parameters; i++) {
        params.push(getOperationParameter(i + 1, address, memory, operation, data));
    }
    return params;
}

function writeMemory(
    memory: Memory,
    parameterNumber: number,
    address: number,
    operation: Operation,
    data: Data,
    result: number
) {
    switch (operation.parameterModes[parameterNumber - 1]) {
        case "Immediate":
            throw new InterpreterError("Cannot write in immediate mode", "WriteError");
        case "Position":
            memory[getMemoryAddress(memory, address + parameterNumber)] = result;
            break;
        case "Relative":
            memory[data.relativeBase + getMemoryAddress(memory, address + parameterNumber)] = result;
            break;
        default:
            throw new InterpreterError("Cannot find parameter mode", "WriteError");
    }
}

const operationExecutorMap: { [key: number]: OperationExecutor } = {
    1: async (operation, instructionPointer, memory, input, output, data) => {
        const [firstParameter, secondParameter] = getParameters(instructionPointer, memory, operation, data);
        writeMemory(memory, 3, instructionPointer, operation, data, firstParameter + secondParameter);
    },
    2: async (operation, instructionPointer, memory, input, output, data) => {
        const [firstParameter, secondParameter] = getParameters(instructionPointer, memory, operation, data);
        writeMemory(memory, 3, instructionPointer, operation, data, firstParameter * secondParameter);
    },
    3: async (operation, instructionPointer, memory, input, output, data) => {
        writeMemory(memory, 1, instructionPointer, operation, data, await input());
    },
    4: async (operation, instructionPointer, memory, input, output, data) => {
        const [parameter] = getParameters(instructionPointer, memory, operation, data);
        const result = output(parameter);
        if (voidIsPromise(result)) {
            await result;
        }
    },
    5: async (operation, instructionPointer, memory, input, output, data) => {
        const [parameter, ret] = getParameters(instructionPointer, memory, operation, data);
        if (parameter !== 0) {
            return ret;
        }
    },
    6: async (operation, instructionPointer, memory, input, output, data) => {
        const [parameter, ret] = getParameters(instructionPointer, memory, operation, data);
        if (parameter === 0) {
            return ret;
        }
    },
    7: async (operation, instructionPointer, memory, input, output, data) => {
        const [firstParameter, secondParameter] = getParameters(instructionPointer, memory, operation, data);
        let result: number = 0;
        if (firstParameter < secondParameter) {
            result = 1;
        }
        writeMemory(memory, 3, instructionPointer, operation, data, result);
    },
    8: async (operation, instructionPointer, memory, input, output, data) => {
        const [firstParameter, secondParameter] = getParameters(instructionPointer, memory, operation, data);
        let result: number = 0;
        if (firstParameter === secondParameter) {
            result = 1;
        }
        writeMemory(memory, 3, instructionPointer, operation, data, result);
    },
    9: async (operation, instructionPointer, memory, input, output, data) => {
        const [firstParameter] = getParameters(instructionPointer, memory, operation, data);
        data.relativeBase += firstParameter;
    }
};
