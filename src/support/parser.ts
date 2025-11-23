import { CCoordinate, Coordinate, Coordinate3d } from "./geometry";
import { FixedSizeMatrix } from "./matrix";
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

    public first(): T {
        if (this.data.length === 0) {
            throw new Error("Could not find any data");
        }
        return this.data[0];
    }

    public startSimpleLabeling() {
        return new Labeler(this.data, {});
    }

    public map<TNext>(mapper: (e: T, i: number) => TNext): SimpleParser<TNext> {
        return new SimpleParser<TNext>(this.data.map((e, i) => mapper(e, i)));
    }

    public group(sep: number | ((e: T) => boolean)) {
        return new GroupParser(this.data, sep);
    }
}

class NestedParser<T> extends SimpleParser<T[]> {
    public flat(): SimpleParser<T> {
        return new SimpleParser<T>(this.run().flat());
    }
    public pivot(): NestedParser<T> {
        const data = this.run();
        const length = Math.min(...data.map(e => e.length));
        const result: T[][] = [];
        for (let i = 0; i < length; i++) {
            const r: T[] = [];
            for (let j = 0; j < data.length; j++) {
                r.push(data[j][i]);
            }
            result.push(r);
        }
        console.log(data);
        console.log(result);
        return new NestedParser<T>(result);
    }
    public startLabeling() {
        const lines = this.run().length;
        const results: Array<{}> = [];
        for (let i = 0; i < lines; i++) {
            results.push({});
        }
        return new ListLabeler(
            this.run(),
            results
        );
    }
}


class GroupParser<T> extends NestedParser<T> {
    constructor(data: T[], sep: number | ((e: T) => boolean)) {
        if (typeof sep === "number") {
            super([...buildGroups(data, sep, sep)]);
        } else {
            super([...buildGroupsFromSeparator(data, sep)]);
        }
    }
}

class StringGroupParser extends GroupParser<string> {
    public numbers() {
        return new SimpleParser<number[]>(this.run().map(e => e.map(x => parseInt(x, 10))));
    }

    public groupMap<U>(callback: (p: LineParser) => U): SimpleParser<U> {
        return new SimpleParser(this.run().map(group => (callback(new LineParser(group)))));
    }
}

const isPipelineParser = (e: unknown): e is PipelineParser<any> => {
    return (e as PipelineParser<unknown>).run !== undefined;
}

class Labeler<T, TData> extends FlatParser<T> {
    /**
     *
     */
    constructor(private lines: TData[], private obj: T) {
        super(obj);
    }

    public label<TLabel extends readonly string[], U>(callback: (s: TData) => U, ...labels: TLabel) {
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

class ListLabeler<T, TData> extends SimpleParser<T> {
    /**
     *
     */
    constructor(private lines: TData[][], private objs: T[]) {
        super(objs);
    }

    public label<TLabel extends readonly string[], U>(callback: (s: TData) => U, ...labels: TLabel) {
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

    public header<T>(length: number, callback: (header: Parser, rest: Parser) => T): T {
        const header = this.run().slice(0, length);
        const rest = this.run().slice(length);
        return callback(new Parser(header), new Parser(rest));
    }

    public slice(start: number, end?: number) {
        return new LineParser(this.run().slice(start, end));
    }

    public tokenize(separator: string | RegExp = " "): TokenParser {
        return new TokenParser(this.run(), separator);
    }

    public transform(regex: RegExp) {
        return new LineParser(this.run().map(e => new StringParser(e).transform(regex).run()));
    }

    public asNumbers() {
        return this.map(e => parseInt(e, 10));
    }

    public extractAllNumbers(canBeNegative: boolean = false) {
        return new NestedParser(this.stringParse(s => s.ns(canBeNegative)).run());
    }

    public stringParse<T>(callback: (s: StringParser) => T): SimpleParser<T> {
        return this.map(l => {
            const res = callback(new StringParser(l))
            return res;
        });
    }

    public matrix<T>(mapper: (s: string) => T): FixedSizeMatrix<T> {
        return FixedSizeMatrix.fromLines(this.run(), mapper);
    }

    public matrixNumbers(defaultValue: number | undefined): FixedSizeMatrix<number> {
        const getDefaultValue = () => {
            if (defaultValue === undefined) {
                throw new Error("No default value and found an invalid number in the matrix");
            }
            return defaultValue;
        }
        return FixedSizeMatrix.fromLines(this.run(), (e => Parser.isNumber(e) ? parseInt(e, 10) : getDefaultValue()));
    }

    public matrixMixedNumbers(): FixedSizeMatrix<Number | string> {
        return FixedSizeMatrix.fromLines(this.run(), (e => Parser.isNumber(e) ? parseInt(e, 10) : e));
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

    public compressSpaces() {
        return this.replace(/\s+/, " ");
    }

    public replace(token: string | RegExp, replaceWith: string, replaceAll: boolean = true) {
        return new LineParser(this.run().map(r => replaceAll ? r.replaceAll(token, replaceWith) : r.replace(token, replaceWith)));
    }

    public remove(token: string | RegExp) {
        return this.replace(token, "");
    }
}

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

    public transform(regex: RegExp | ((s: string) => string)): StringParser {
        if (typeof regex === "function") {
            return new StringParser(regex(this.run()));
        }
        const match = this.run().match(regex);
        if (!match) {
            throw new Error("Did not match regex");
        }
        const mainMatch = (() => {
            if (match.length === 1) return match[0];
            if (match.length === 2) return match[1];
            throw new Error("Invalid regex; matches: " + (match.length - 1));
        })();
        return new StringParser(mainMatch);
    }

    public pns(canBeNegative: boolean = false, base: number = 10): SimpleParser<number> {
        return new SimpleParser(this.ns(canBeNegative, base));
    }

    public ns(canBeNegative: boolean = false, base: number = 10): number[] {
        const regex = canBeNegative ? /(-?\d+)/g : /(\d+)/g;
        const matches = this.data.match(regex);
        if (!matches) {
            return [];
        }
        return matches.map(e => parseInt(e, base));
    }

    public n(base: number = 10): number {
        const match = this.data.match(/\d+/);
        if (match == null) {
            throw new Error("No number in " + this.data);
        }
        return parseInt(match[0], base)
    }

    public tokenize(separator: string | RegExp) {
        return new Parser(this.data.split(separator));
    }

    public extract3dCoordinates(): Coordinate3d {
        const regex = /(-?\d+)[^\d]+(-?\d+)[^\d]+(-?\d+)/;
        const matches = this.data.match(regex);
        if (matches == null) {
            throw new Error("No matches on " + this.data);
        }
        if (matches.length !== 4) {
            throw new Error("Invalid coordinate match for " + this.data);
        }
        const [x,y,z] = matches.slice(1).map(e => parseInt(e, 10));
        return {x,y,z};
    }

    public extractCoordinates(): CCoordinate {
        const regex = /(-?\d+)[^\d-]+(-?\d+)/
        const matches = this.data.match(regex);
        if (matches == null) {
            throw new Error("No matches on " + this.data);
        }
        if (matches.length !== 3) {
            throw new Error("Invalid coordinate match for " + this.data);
        }
        const [x,y] = matches.slice(1).map(e => parseInt(e, 10));
        return new CCoordinate(x, y);
    }


    public extractGroupRegex<T extends ((s: StringParser) => any)[]>(regex: RegExp, ...mappers: [...T]): SimpleParser<{
        [K in keyof T]: T[K] extends (s: StringParser) => any ? ReturnType<T[K]> : never
    }[number]>;
    public extractGroupRegex(regex: RegExp, ...mappers: Array<(s: StringParser) => any>)
    {
        const matches = this.run().match(regex);
        if (matches == null) {
            throw new Error("No matches on: " + this.run());
        }
        if (matches.length !== mappers.length + 1) {
            throw new Error("Mismatch in group length");
        }
        return new SimpleParser(mappers.map((mapper, index) => mapper(new StringParser(matches[index+1]))));
    }

}

class TokenParser extends SimpleParser<string[]> {

    constructor(data: string[], separator: string | RegExp) {
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
    public static isNumber(e: unknown): e is number {
        return e !== "" && !isNaN(Number(e));
    }
}