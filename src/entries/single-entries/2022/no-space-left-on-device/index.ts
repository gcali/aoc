import { entryForFile } from "../../../entry";

type File = {
    name: string;
    size: number;
    parent: Directory | null;
}

type FileSystemEntry = (Directory | File);

type Directory = {
    name: string;
    children: FileSystemEntry[];
    parent: Directory | null;
    size: number | null;
}

class FileSystem {

    public cwd: Directory;

    private root: Directory;
    /**
     *
     */
    constructor() {
        this.root = {
            name: "/",
            children: [],
            parent: null,
            size: null
        };
        this.cwd = this.root;
    }

    public *getDirectories() {
        function *recursive(entry: Directory): Iterable<Directory> {
            yield entry;
            for (const item of entry.children) {
                if (isDirectory(item)) {
                    for (const inner of recursive(item)) {
                        yield inner;
                    }
                }
            }
        }
        for (const e of recursive(this.root)) {
            yield e;
        }
    }

    public changeTo(path: string): FileSystem {
        if (path === "/") {
            this.cwd = this.root;
        } else if (path === "..") {
            if (this.cwd.parent !== null) {
                this.cwd = this.cwd.parent;
            } else {
                throw new Error("Cannot navigate over root");
            }
        } else {
            const match = this.cwd.children.find(e => e.name === path);
            if (match === undefined) {
                throw new Error("Cannot find dir: " + path);
            } else if (!isDirectory(match)) {
                throw new Error("Not a directory: " + path);
            }
            this.cwd = match;
        }

        return this;
    }

    public addFile(name: string, size: number) {
        const entry: File = {
            name,
            size,
            parent: this.cwd
        };
        this.cwd.children.push(entry);
    }

    public addDir(name: string) {
        const entry: Directory = {
            name,
            children: [],
            parent: this.cwd,
            size: null
        };
        this.cwd.children.push(entry);
    }

    public calculateSizes(shouldClean: boolean = false) {
        if (shouldClean) {
            const cleaner = (entry: FileSystemEntry) => {
                if (isFile(entry)) {
                    return;
                }
                for (const child of entry.children) {
                    cleaner(child);
                }
                entry.size = null;
            }
            cleaner(this.root);
        }
        const call = (entry: FileSystemEntry): number => {
            if (isFile(entry)) {
                return entry.size;
            }
            if (entry.size !== null) {
                return entry.size;
            }
            let size = 0;
            for (const child of entry.children) {
                size += call(child);
            }
            entry.size = size;
            return size;
        }
        call(this.root);
    }

    public toString() {
        const call = (entry: FileSystemEntry, indentation: number): string[] => {
            const indent = (() => {
                const res: string[] = [];
                for (let i = 0; i < indentation; i++) {
                    res.push(" ");
                }
                const prefix = res.join("");
                return (line: string) => prefix + line;
            })();
            if (isFile(entry)) {
                return [indent(`- ${entry.name} (file, size=${entry.size})`)]
            } else {
                const result: string[] = [];
                const dirSize = entry.size === null ? "" : `, size=${entry.size}`;
                result.push(indent(`- ${entry.name} (dir${dirSize})`));
                for (const child of entry.children) {
                    for (const rec of call(child, indentation + 2)) {
                        result.push(rec);
                    }
                }
                return result;
            }
        }

        return call(this.root, 0).join("\n");
    }

}

const isDirectory = (e: FileSystemEntry): e is Directory => (e as Directory).children !== undefined;
const isFile = (e: FileSystemEntry): e is File => !isDirectory(e);

const parseInput = (lines: string[]): FileSystem => {

    const fileSystem = new FileSystem();

    let i = 0;
    while (i < lines.length) {
        const currentLine = lines[i];
        if (!currentLine.startsWith("$")) {
            throw new Error("Must have a command");
        }

        const command = currentLine.slice(2);

        if (command === "ls") {
            let j = i + 1;
            while (true) {
                const line = lines[j];
                if (line === undefined) {
                    break;
                }
                if (line.startsWith("$")) {
                    break;
                }
                const space = line.indexOf(" ");
                const type = line.slice(0, space);
                const name = line.slice(space + 1);
                if (type === "dir") {
                    fileSystem.addDir(name)
                } else {
                    const size = parseInt(type, 10);
                    fileSystem.addFile(name, size);
                }
                j++;
            }
            i = j;
        } else {
            const path = command.slice(3);
            fileSystem.changeTo(path);
            i++;
        }
    }

    return fileSystem;
}

export const noSpaceLeftOnDevice = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback, isQuickRunning }) => {
        const fileSystem = parseInput(lines);

        fileSystem.calculateSizes();

        if (!isQuickRunning) {
            await outputCallback(fileSystem.toString());
        }

        let result = 0;
        const threshold = 100000;
        for (const dir of fileSystem.getDirectories()) {
            if (dir.size === null) {
                throw new Error("Calculation didn't work");
            }
            if (dir.size <= threshold) {
                result += dir.size;
            }
        }

        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const allSpace = 70000000;
        const updateSpace = 30000000;
        const fileSystem = parseInput(lines);

        fileSystem.calculateSizes();

        const usedSpace = fileSystem.changeTo("/").cwd.size!;

        const needSpace = updateSpace - (allSpace - usedSpace);
        let result = Number.POSITIVE_INFINITY;
        for (const dir of fileSystem.getDirectories()) {
            const size = dir.size!;
            if (size >= needSpace && size < result) {
                result = size;
            }
        }
        await resultOutputCallback(result);
    },
    {
        key: "no-space-left-on-device",
        title: "No Space Left On Device",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);