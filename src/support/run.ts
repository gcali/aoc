export const createIntervalPauser = (amount: number, pause: () => Promise<void>): () => Promise<void> => {
    let i = 0;
    return (async () => {
        i++;
        if (i >= amount) {
            await pause();
            i = 0;
        }
    });
};
