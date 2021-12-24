const myMonad = [5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

const randomMonad = () => {
    const monad = [];
    for (let i = 0; i < 14; i++) {
        monad.push(getRandomInt(1, 10));
    }
    return monad;
}

const pattern = (MONAD) => {
    const zFactors = [
        1, 1,
        1, 26,
        1, 26,
        1, 1,
        1, 26,
        26, 26,
        26, 26
    ];
    const xAdditions = [
        13, 11,
        15, -11,
        14, 0,
        12, 12,
        14, -6,
        -10, -12,
        -3, -5
    ];

    const yAdditions = [
        13, 10,
        5, 14,
        5, 15,
        4, 11,
        1, 15,
        12, 8,
        14, 9
    ];

    const digits = [];

    for (let i = 0; i < 14; i++) {
        if (zFactors[i] === 1) {
            digits.push(MONAD[i] + yAdditions[i]);
        } else {
            let k = digits.pop() + xAdditions[i];
            if (k !== MONAD[i]) {
                digits.push(MONAD[i] + yAdditions[i]);
            }
        }
    }
    return digits.reduce((acc, next) => acc * 26 + next, 0);
    // console.log(digits);
    // if (digits.length === 0) {
    //     return 0;
    // }
    // console.log(digits.length);
    //3
    // digits = [0, 1, 2]
    // digits = [0, 1]
    // digits = [0, 1, 4]
    // //5
    // digits = [0, 1]
    // digits = [0, 1, 6]
    // digits = [0, 1, 6, 7]
    // digits = [0, 1, 6, 7, 8]
    // MONAD[9] === MONAD[8] - 5
    // MONAD[10] === MONAD[7] + 1
    // MONAD[11] === MONAD[6] - 8
    // MONAD[5] === MONAD[4] + 5
    // MONAD[3] === MONAD[2] - 6
    // MONAD[12] === MONAD[1] + 7
    // MONAD[13] === MONAD[0] + 8

    // 1
    // 1
    // 7
    // 1
    // 1
    // 6
    // 9
    // 1
    // 6
    // 1
    // 2
    // 1
    // 8
    // 9

    // 1
    // 2
    // 9
    // 3
    // 4
    // 9
    // 9
    // 8
    // 9
    // 4
    // 9
    // 1
    // 9
    // 9

    // 1, 1,
    // 1, 26,
    // 1, 26,
    // 1, 1,
    // 1, 26,
    // 26, 26,
    // 26, 26
}

const original = (MONAD) => {
    let x = 0;
    let y = 0;
    let z = 0;
    let w = 0;
    w = MONAD[0];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 1);
    x += 13;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 13;
    y *= x;
    z += y;
    w = MONAD[1];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 1);
    x += 11;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 10;
    y *= x;
    z += y;
    w = MONAD[2];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 1);
    x += 15;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 5;
    y *= x;
    z += y;
    w = MONAD[3];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 26);
    x += -11;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 14;
    y *= x;
    z += y;
    w = MONAD[4];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 1);
    x += 14;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 5;
    y *= x;
    z += y;
    w = MONAD[5];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 26);
    x += 0;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 15;
    y *= x;
    z += y;
    w = MONAD[6];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 1);
    x += 12;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 4;
    y *= x;
    z += y;
    w = MONAD[7];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 1);
    x += 12;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 11;
    y *= x;
    z += y;
    w = MONAD[8];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 1);
    x += 14;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 1;
    y *= x;
    z += y;
    w = MONAD[9];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 26);
    x += -6;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 15;
    y *= x;
    z += y;
    w = MONAD[10];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 26);
    x += -10;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 12;
    y *= x;
    z += y;
    w = MONAD[11];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 26);
    x += -12;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 8;
    y *= x;
    z += y;
    w = MONAD[12];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 26);
    x += -3;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 14;
    y *= x;
    z += y;
    w = MONAD[13];
    x *= 0;
    x += z;
    x %= 26;
    z = Math.trunc(z / 26);
    x += -5;
    x = (x === w ? 1 : 0);
    x = (x === 0 ? 1 : 0);
    y *= 0;
    y += 25;
    y *= x;
    y += 1;
    z *= y;
    y *= 0;
    y += w;
    y += 9;
    y *= x;
    z += y;
    return z;
}

for (let i = 0; i < 100; i++) {
    const m = randomMonad();
    const o = original(m);
    const p = pattern(m);
    console.log(o, p);
    if (o !== p) {
        throw new Error("Invalid pattern");
    }
}

const monad = [
    1
    , 2
    , 9
    , 3
    , 4
    , 9
    , 9
    , 8
    , 9
    , 4
    , 9
    , 1
    , 9
    , 9
];
console.log(pattern(monad));
const minMonad = [
    1
    , 1
    , 7
    , 1
    , 1
    , 6
    , 9
    , 1
    , 6
    , 1
    , 2
    , 1
    , 8
    , 9
];
console.log(pattern(minMonad));
console.log(minMonad.join(""));
// console.log(monad.join(""));
console.log("All good");