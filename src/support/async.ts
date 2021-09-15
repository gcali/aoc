export async function forEachAsync<T>(data: T[], action: ((e: T) => Promise<void>)) {
    for (const element of data) {
        await action(element);
    }
}

export async function mapAsync<T, U>(data: T[], action: ((e: T) => Promise<U>)): Promise<U[]> {
    const res = [];
    for (const element of data) {
        res.push(await action(element));
    }
    return res;
}

export function setTimeoutAsync(timeout: number): Promise<void> {
    return new Promise<void>((resolve, reject) => setTimeout(() => resolve(), timeout));
}
export function voidIsPromise(e: void | Promise<void>): e is Promise<void> {
    const casted = e as Promise<void>;
    return casted && casted.then !== undefined;
}

export function isPromise(e: void | Promise<any>): e is Promise<any> {
    const casted = e as Promise<any>;
    return casted && casted.then !== undefined;
}
