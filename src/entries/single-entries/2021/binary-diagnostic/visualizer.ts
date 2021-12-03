import { opposite } from ".";
import { OutputCallback, Pause } from "../../../entry";

const printer = (
    outputCallback: OutputCallback, 
    pause: Pause, 
    isQuickRunning: boolean,
    ...data: {name: string, els: string[]}[]
    ) => {
        return async () => {
            if (isQuickRunning) {
                return;
            }

            await outputCallback(
                data.map(e => `${e.name}: ${e.els.join("")}`).join("\n"),
                true
            );
            await pause();
        };
}

export const firstFactory = (
    outputCallback: OutputCallback,
    pause: Pause,
    isQuickRunning: boolean,
    data: { gamma: string[], power: string[] }
) => {
    const { gamma, power } = data;
    // const print = async () => {
    //     if (isQuickRunning) {
    //         return;
    //     }
    //     await outputCallback("Gamma: " + gamma.join("") + "\nPower: " + power.join(""), true);
    //     await pause();
    // };

    const print = printer(
        outputCallback,
        pause,
        isQuickRunning,
        {name: "Gamma", els: gamma}, 
        {name: "Power", els: power}
    );

    let current = 0;

    return (i: number) => async (c0: number) => {
        current++;
        const g = c0 > current / 2 ? "0" : "1";
        if (gamma[i] !== g) {
            gamma[i] = g;
            power[i] = opposite(g);
            await print();
        }
    };
};

export const secondFactory = (
    outputCallback: OutputCallback,
    pause: Pause,
    isQuickRunning: boolean,
    {oxygen, co2}: {oxygen: string[], co2: string[] }
) => {
    return printer(
        outputCallback,
        pause,
        isQuickRunning,
        {name: "Oxygen", els: oxygen},
        {name: "CO2   ", els: co2}
    );
}