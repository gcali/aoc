import { buildGroups, buildGroupsFromSeparator, groupBy } from "./sequences";

type Separator<T> = number | T | ((line: T) => boolean);

abstract class PipelineParser<TState> {
    public abstract run(): TState;
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
}


class TokenParser extends SimpleParser<string[]> {

    constructor(data: string[], separator: string = " ") {
        const tokenized = data.map(d => d.split(separator));
        super(tokenized);
    }

}

export class Parser extends LineParser {

}

// export class Parser {
//     constructor(private lines: string[]) {
//     }

//     public tokenize(separator: string = " ") {
//         return this.lines.map(line => line.split(separator));
//     }

//     public asNumbers(): number[] {
//         return this.lines.map(l => parseInt(l, 10));
//     }

//     private static asGenericGroups<T>(data: T[], separator: Separator<T>) {
//         if (typeof separator === "number") {
//             return [...buildGroups(data, separator)];
//         }
//         if (typeof separator !== "function") {
//             const stringSeparator = separator;
//             separator = (line: T) => line === stringSeparator;
//         }
//         return [...buildGroupsFromSeparator(data, separator as (e: T) => boolean)];
//     }

//     public asGroups(separator: Separator<string>) {
//         return Parser.asGenericGroups(this.lines, separator);
//     }

//     public asNumberGroups(separator: Separator<string>) {
//         const groups = this.asGroups(separator);
//         return groups.map(g => g.map(e => parseInt(e, 10)));
//     }

// }