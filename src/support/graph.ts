import { PriorityQueue } from "priorityqueue/lib/cjs/PriorityQueue";
import { DefaultDict, Queue } from "./data-structure";

type GraphEdge<T> = {
    from: T;
    to: T;
}

type Key = string | number;

type GraphOptions<T> = {
    undirected?: boolean;
    serializer: (e: T) => Key;
}
export class Graph<T> {
    /**
     *
     */
    private readonly nodes = new Map<Key, T>();
    private readonly edges = new DefaultDict<Key, T[]>(() => []);
    private readonly rawEdges: GraphEdge<T>[];
    private readonly serializer: (e: T) => Key;

    constructor(edges: GraphEdge<T>[], {serializer, undirected}: GraphOptions<T>) {
        this.serializer = serializer;
        this.rawEdges = edges;
        for (const edge of edges) {
            this.handleEdge(edge);
            if (undirected) {
                this.handleEdge({from: edge.to, to: edge.from});
            }
        }
    }

    private handleEdge(edge: GraphEdge<T>) {
        this.nodes.set(this.serializer(edge.from), edge.from);
        this.nodes.set(this.serializer(edge.to), edge.to);
        this.edges.ensureAndGet(this.serializer(edge.from)).push(edge.to);
    }

    public getTreeRoots(): T[] {
        const result: T[] = [];
        for (const [key, node] of this.nodes.entries()) {
            if (this.edges.get(key).length === 0) {
                result.push(node);
            }
        }
        return result;
    }

    public reverse(): Graph<T> {
        return new Graph<T>(this.rawEdges.map(e => ({to: e.from, from: e.to})), {serializer: this.serializer});
    }

    private getConnections(a: T): T[] {
        return this.edges.get(this.serializer(a));
    }

    public isConnectedTo(a: T, b: T) {
        const serializedConnections = this.getConnections(a).map(this.serializer);
        return serializedConnections.includes(this.serializer(b));
    }

    public canGo(from: T, to: T) {
        const queue = new Queue<T>();
        queue.add(from);
        const visited = new Set<Key>();
        visited.add(this.serializer(from));
        while (!queue.isEmpty) {
            const current = queue.get()!;
            if (this.serializer(current) === this.serializer(to)) {
                return true;
            }
            for (const reachable of this.getConnections(current)) {
                const s = this.serializer(reachable);
                if (!visited.has(s)) {
                    visited.add(s);
                    queue.add(reachable);
                }
            }
        }
        return false;
    }
}