import { buildGroups, buildGroupsFromSeparator, groupBy } from "./sequences";

type Separator<T> = number | T | ((line: T) => boolean);

abstract class PipelineParser<TState> {
    public abstract run(): TState;
}

class FlatParser<TState> extends PipelineParser<TState> {
    constructor(private data: TState) {
        super();
    }

    // public run<TOut>(mapper?: (e: TState) => TOut): TOut;
    // public run(): TState;
    // public run<TOut>(mapper?: (e: TState) => TOut): TOut {
    //     if (mapper) {
    //         return mapper(this.data);
    //     }
    //     return (this.data as unknown) as TOut;
    // }

    public run() {
        return this.data;
    }

    public map<TOut>(mapper: (e: TState) => TOut): FlatParser<TOut> {
        return new FlatParser(mapper(this.data));
    }

}

class IteratedParser<T extends any[]> extends FlatParser<[...T]> {
    public label<TLabel extends readonly string[]>(...labels: TLabel): {
        [K in TLabel[number]]: T[number]
    } {
        const res: {[K in keyof T]: T[K]} = ({} as any);
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            res[label as any] = (this.run() as any)[i];
        }
        return res as any;
    }
}

class SimpleParser<T> extends PipelineParser<T[]> {
    constructor(private data: T[]) {
        super();
        
    }
    public run(): T[] {
        return this.data;
    }

    public map<TNext>(mapper: (e: T) => TNext) {
        return new SimpleParser<TNext>(this.data.map(mapper));
    }

    public group(sep: number | ((e: T) => boolean)) {
        return new GroupParser(this.data, sep);
    }
}

class GroupParser<T> extends SimpleParser<T[]> {
    constructor(data: T[], sep: number | ((e: T) => boolean)) {
        if (typeof sep === "number") {
            super([...buildGroups(data, sep)]);
        } else {
            super([...buildGroupsFromSeparator(data, sep)]);
        }
    }
}

class StringGroupParser extends GroupParser<string> {
    public numbers() {
        return new SimpleParser<number[]>(this.run().map(e => e.map(x => parseInt(x, 10))));
    }
}

const isPipelineParser = (e: unknown): e is PipelineParser<any> => {
    return (e as PipelineParser<unknown>).run !== undefined;
}

class Labeler<T> extends FlatParser<T> {
    /**
     *
     */
    constructor(private lines: StringParser[], private obj: T) {
        super(obj);
    }

    public label<TLabel extends readonly string[], U>(callback: (s: StringParser) => U, ...labels: TLabel) {
        if (labels.length !== 1) {
            throw new Error("No label given for this callback: " + callback.toString());
        }
        const v = callback(this.lines[0]);
        if (isPipelineParser(v)) {
            throw new Error("Did not run a parser finisher");
        }
        const [key] = labels;
        const res = Object.assign({}, this.obj, {[key]: v}) as {
            [K in TLabel[number]]: U
        } & T;
        return new Labeler(this.lines.slice(1), res);
    }
}

class ListLabeler<T> extends SimpleParser<T> {
    /**
     *
     */
    constructor(private lines: StringParser[][], private objs: T[]) {
        super(objs);
    }

    public label<TLabel extends readonly string[], U>(callback: (s: StringParser) => U, ...labels: TLabel) {
        const results: Array<{
            [K in TLabel[number]]: U
        } & T> = [];

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const v = callback(line[0]);
            if (isPipelineParser(v)) {
                throw new Error("Did not run a parser finisher");
            }
            const [key] = labels;
            const res = Object.assign({}, this.objs[i], {[key]: v}) as 
            {
                [K in TLabel[number]]: U
            } & T;
            results.push(res);
        }
        return new ListLabeler(this.lines.map(l => l.slice(1)), results);
    }
}

export class LineParser extends SimpleParser<string> {
    constructor(lines: string[]) {
        super(lines);
    }

    public tokenize(separator: string = " "): TokenParser {
        return new TokenParser(this.run(), separator);
    }

    public numbers() {
        return this.map(e => parseInt(e, 10));
    }

    public group(sep: string | number | ((e: string) => boolean)) {
        if (typeof sep === "string") {
            return new StringGroupParser(this.run(), e => e.trim() === sep);
        }
        return new StringGroupParser(this.run(), sep);
        // return super.group(sep);
    }

    public groupAsNumbers(sep: string | number | ((e: string) => boolean)) {
        const groupped = this.group(sep);
        return new SimpleParser<number[]>(groupped.run().map(e => e.map(n => parseInt(n, 10))));
    }

    public startLabeling() {
        return new Labeler(this.run().map(l => new StringParser(l)), {});
    }

    public iterate<T1, T2>(c1: (token: StringParser) => T1 | PipelineParser<T1>, c2: (token: StringParser) => T2 | PipelineParser<T2>): IteratedParser<[T1, T2]>
    public iterate(callback: (token: StringParser) => StringParser): IteratedParser<[string]>
    public iterate<T>(callback: (token: StringParser) => T): IteratedParser<[T]>
    public iterate(...nested: Array<(token: StringParser) => any>) {
        return new IteratedParser(this.run().map((line, index) => {
            const res = nested[index](new StringParser(line));
            if (isPipelineParser(res)) {
                return res.run();
            }
            return res;
        }));
    }
}

const x = /hi/;

class StringParser extends PipelineParser<string> {
    constructor(private data: string) {
        super();
    }
    public run(): string {
        return this.data;
    }

    public s(): string {
        return this.run();
    }

    public n(base: number = 10): number {
        const match = this.data.match(/\d+/);
        if (match == null) {
            throw new Error("No number in " + this.data);
        }
        return parseInt(match[0], base)
    }

    public tokenize(separator: string) {
        return new Parser(this.data.split(separator));
    }


    public extractGroupRegex<T extends ((s: string) => any)[]>(regex: RegExp, ...mappers: [...T]): FlatParser<{
        [K in keyof T]: T[K] extends (s: string) => any ? ReturnType<T[K]> : never
    }>;
    public extractGroupRegex(regex: RegExp, ...mappers: Array<(s: string) => any>)
    {
        const matches = this.run().match(regex);
        if (matches == null) {
            throw new Error("No matches on: " + this.run());
        }
        if (matches.length !== mappers.length + 1) {
            throw new Error("Mismatch in group length");
        }
        return new FlatParser(mappers.map((mapper, index) => mapper(matches[index+1])));
    }

}

class TokenParser extends SimpleParser<string[]> {

    constructor(data: string[], separator: string = " ") {
        const tokenized = data.map(d => d.split(separator));
        super(tokenized);
    }

    public mapTokens<T>(mapper: (token: StringParser) => T | PipelineParser<T>): T[][] {
        return this
            .run()
            .map(line => line.map(tokens => new StringParser(tokens)).map(t => {
                const res = mapper(t);
                if (isPipelineParser(res)) {
                    return res.run();
                }
                return res;
            }));
    }

    public mapString<T>(mapper: (s: StringParser) => T): T[][] {
        return this.run().map(line => line.map(e => mapper(new StringParser(e))));
    }

    public startLabeling() {
        const lines = this.run().length;
        const results: Array<{}> = [];
        for (let i = 0; i < lines; i++) {
            results.push({});
        }
        return new ListLabeler(
            this.run().map(l => l.map(t => new StringParser(t))), 
            results
        );
    }

    public iterate<T1, T2>(c1: (token: StringParser) => T1 | PipelineParser<T1>, c2: (token: StringParser) => T2 | PipelineParser<T2>): SimpleParser<[T1, T2]>
    public iterate<T>(callback: (token: StringParser) => T | PipelineParser<T>): SimpleParser<[T]>
    public iterate(...nested: Array<(token: StringParser) => any>) {
        return new SimpleParser(this.run().map(line => nested.map((callback, index) => {
            const res = callback(new StringParser(line[index]));
            if (isPipelineParser(res)) {
                return res.run();
            }
            return res;
        })));
    }

}

export class Parser extends LineParser {

}