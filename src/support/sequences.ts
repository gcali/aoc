export function howManySameAtEnd<T>(sequence: T[]): number {
    if (!sequence || sequence.length === 0) {
        return 0;
    }
    let counter = 1;
    const lastElement: T = sequence[sequence.length - 1];
    for (let i = sequence.length - 2; i >= 0; i--) {
        if (lastElement === sequence[i]) {
            counter++;
        } else {
            break;
        }
    }
    return counter;
}

export const it = <T, >(e: Iterable<T>): MyIterable<T> => new MyIterable(e);

export class MyAsyncIterable<T> implements AsyncIterable<T> {

    public static fromIterable<T>(data: Iterable<T>) {
        async function *generator() {
            for (const item of data) {
                yield item;
            }
        }
        return new MyAsyncIterable(generator());
    }
    /**
     *
     */
    constructor(private data: AsyncIterable<T>) {
    }
    public async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
        for await (const item of this.data) {
            yield item;
        }
    }

    public zip<U>(other: Iterable<U>): MyAsyncIterable<[T, U]> {
        const that = this;
        async function* inner() {
            const thisIterator = that[Symbol.asyncIterator]();
            const otherIterator = other[Symbol.iterator]();
            while (true) {
                const a = await thisIterator.next();
                if (a.done) {
                    return;
                }
                const b = otherIterator.next();
                if (b.done) {
                    return;
                }
                yield [a.value, b.value] as [T, U];
            }
        }
        return new MyAsyncIterable(inner());
    }

    public map<U>(map: (e: T) => Promise<U>): MyAsyncIterable<U> {
        const that = this;
        async function* inner() {
            for await (const item of that.data) {
                yield map(item);
            }
        }
        return new MyAsyncIterable(inner());
    }

    public windows(size: number): MyAsyncIterable<T[]> {
        const that = this;
        async function* inner() {
            const windows: T[][] = [];
            for await (const item of that.data) {
                windows.forEach((w) => w.push(item));
                windows.push([item]);
                if (windows[0].length === size) {
                    yield windows[0];
                    windows.shift();
                }
            }
        }
        return new MyAsyncIterable(inner());
    }

    public async count(): Promise<number> {
        let count = 0;
        for await (const item of this.data) {
            count++;
        }
        return count;
    }


    public filter(filter: (e: T) => Promise<boolean>): MyAsyncIterable<T> {
        const that = this;
        async function* inner() {
            for await (const item of that.data) {
                if (await filter(item)) {
                    yield item;
                }
            }
        }
        return new MyAsyncIterable(inner());
    }

    public async reduce<TAcc>(acc: TAcc, reducer: (acc: TAcc, next: T) => Promise<TAcc>): Promise<TAcc> {
        for await (const item of this.data) {
            acc = await reducer(acc, item);
        }
        return acc;
    }

    public async simpleReduce(reducer: (acc: T, next: T) => Promise<T>): Promise<T> {
        const isFirst = true;
        const iterator = this.data[Symbol.asyncIterator]();
        const first = await iterator.next();
        if (first.done) {
            throw new Error("Cannot reduce without acc on empty collection");
        }
        let acc: T = first.value;
        while (true) {
            const next = await iterator.next();
            if (next.done) {
                break;
            }
            acc = await reducer(acc, next.value);
        }
        return acc;
    }

}

export class MyIterable<T> implements Iterable<T> {
    /**
     *
     */
    constructor(private data: Iterable<T>) {
    }
    public *[Symbol.iterator](): Iterator<T, any, undefined> {
        for (const item of this.data) {
            yield item;
        }
    }

    public windows(size: number): MyIterable<T[]> {
        const that = this;
        function* inner() {
            const windows: T[][] = [];
            for (const item of that.data) {
                windows.forEach((w) => w.push(item));
                windows.push([item]);
                if (windows[0].length === size) {
                    yield windows[0];
                    windows.shift();
                }
            }
        }
        return new MyIterable(inner());
    }

    public zip<U>(other: Iterable<U>): MyIterable<[T, U]> {
        const that = this;
        function* inner() {
            const thisIterator = that[Symbol.iterator]();
            const otherIterator = other[Symbol.iterator]();
            while (true) {
                const a = thisIterator.next();
                if (a.done) {
                    return;
                }
                const b = otherIterator.next();
                if (b.done) {
                    return;
                }
                yield [a.value, b.value] as [T, U];
            }
        }
        return new MyIterable(inner());
    }

    public map<U>(map: (e: T) => U): MyIterable<U> {
        const that = this;
        function* inner() {
            for (const item of that.data) {
                yield map(item);
            }
        }
        return new MyIterable(inner());
    }

    public count(): number {
        let count = 0;
        for (const item of this.data) {
            count++;
        }
        return count;
    }

    public filter(filter: (e: T) => boolean): MyIterable<T> {
        const that = this;
        function* inner() {
            for (const item of that.data) {
                if (filter(item)) {
                    yield item;
                }
            }
        }
        return new MyIterable(inner());
    }

    public reduce<TAcc>(acc: TAcc, reducer: (acc: TAcc, next: T) => TAcc): TAcc {
        for (const item of this.data) {
            acc = reducer(acc, item);
        }
        return acc;
    }

    public simpleReduce(reducer: (acc: T, next: T) => T): T {
        const iterator = this.data[Symbol.iterator]();
        const first = iterator.next();
        if (first.done) {
            throw new Error("Cannot reduce without acc on empty collection");
        }
        let acc: T = first.value;
        while (true) {
            const next = iterator.next();
            if (next.done) {
                break;
            }
            acc = reducer(acc, next.value);
        }
        return acc;
    }
}

export function groupBy<T>(sequence: T[], n: number): T[][] {
    const result = [];
    let next = [];
    let current = 0;
    for (const e of sequence) {
        next.push(e);
        if (++current === n) {
            result.push(next);
            next = [];
            current = 0;
        }
    }
    if (next.length > 0) {
        result.push(next);
    }
    return result;
}

export function* zip<T, U>(a: T[], b: U[]): Iterable<[T, U]> {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        yield [a[i], b[i]];
    }
}

export function sum(data: Iterable<number>): number {
    let res = 0;
    for (const x of data) {
        res += x;
    }
    return res;
}

export function* range(n: number) {
    for (let i = 0; i < n; i++) {
        yield i;
    }
}

export function* subsequenceGenerator<T>(array: T[]): Iterable<T[]> {
    const start = 0;
    const end = array.length;

    for (let s = start; s < end; s++) {
        for (let e = s + 1; e < end; e++) {
            yield array.slice(s, e + 1);
        }
    }
}

export function* subsetGenerator<T>(array: T[], start: number, howMany: number | null = null): Iterable<T[]> {
    if (start >= array.length || howMany === 0) {
        yield [];
    } else {
        if (howMany !== null) {
            for (const sub of subsetGenerator(array, start + 1, howMany)) {
                yield sub;
            }
            for (const sub of subsetGenerator(array, start + 1, howMany - 1)) {
                yield [array[start]].concat(sub);
            }
        } else {
            for (const sub of subsetGenerator(array, start + 1)) {
                yield sub;
                yield [array[start]].concat(sub);
            }
        }
    }
}

export function* permutationGenerator<T>(array: T[]): Iterable<T[]> {
    if (array.length === 1) {
        yield [array[0]];
    } else {
        for (let i = 0; i < array.length; i++) {
            const startElement = array[i];
            const otherElements = [...array];
            otherElements.splice(i, 1);
            for (const perm of permutationGenerator(otherElements)) {
                yield [startElement].concat(perm);
            }
        }
    }
}


export function* buildGroups<T>(data: T[], size: number, step: number = 1): Iterable<T[]> {
    for (let i = 0; i <= data.length - size; i += step) {
        yield data.slice(i, i + size);
    }
}

export function* buildGroupsFromSeparator<T>(data: Iterable<T>, isSeparator: (e: T) => boolean): Iterable<T[]> {
    let current: T[] = [];
    let hadItems = false;
    for (const item of data) {
        hadItems = true;
        if (isSeparator(item)) {
            yield current;
            current = [];
        } else {
            current.push(item);
        }
    }
    if (hadItems && current.length > 0) {
        yield current;
    }
}
