export const BoardPins: string[] = Array.from(Array(16).keys()).map((i) => `${i}`);
export const DMAChannels: { value: string; label: string; group: string }[] = [5, 10]
    .map((n) => ({
        value: `${n}`,
        label: `Channel ${n}`,
        group: "Recommended",
    }))
    .concat(
        Array.from(Array(15).keys())
            .filter((i) => i !== 5 && i !== 10)
            .map((i) => ({
                value: `${i}`,
                label: `Channel ${i}`,
                group: "All",
            }))
    );
export const GPIOPins: string[] = Array.from(Array(40).keys()).map((i) => `${i}`);
