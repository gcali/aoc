export const modInverse = (n: bigint, mod: bigint): bigint => {
    const {a, b} = calculateExtended(n, mod, 1);
    return a > 0n ? a : a + mod;
};

function modPow(expo: bigint, base: bigint, mod: bigint): bigint {
  // "expo" needs to be of type BigInt
    let x = BigInt(base) % mod, res = expo & 1n? x: 1n
    do {
        x = x**2n % mod
        if (expo & 2n) res = res * x % mod
    } while (expo /= 2n)
    return res
}

export const pow = (n: bigint, exp: bigint, mod: bigint): bigint => {
    return modPow(exp, n, mod);
};

export const factorial = (n: number): number => {
    let res = n;
    while (n-- > 1) {
        res *= n;
    }
    return res;
};

export const logarithm = (base: number, target: number): number => {
  return Math.log(base) / Math.log(target);
};

export const calculateExtended = (aP: number | bigint, bP: number | bigint, m: number | bigint): {
    a: bigint,
    b: bigint
} => {
    aP = BigInt(aP);
    bP = BigInt(bP);
    m = BigInt(m);
    let a = {
        n: aP,
        a: 1n,
        b: 0n
    };
    let b = {
        n: bP,
        a: 0n,
        b: 1n
    };

    while (!(m % b.n === 0n)) {
        const f = a.n / b.n;
        const q = {
            n: a.n % b.n,
            a: a.a - (f * b.a),
            b: a.b - (f * b.b)
        };
        a = b;
        b = q;
    }

    const factor = m / b.n;
    const result = {
        a: b.a * factor,
        b: b.b * factor
    };
    if (result.a * aP + result.b * bP !== m) {
        throw new Error("Inversion did not work: " + JSON.stringify({...result, factor}));
    }
    return result;
};

interface ExtendedEuclidFactor {
    n: number;
    a: number;
    b: number;
}


export function gcd(a: number, b: number): number {
  let t = 0;
  if (a < b) {
      t = b;
      b = a;
      a = t;
  }
//   a < b && (t = b, b = a, a = t); // swap them if a < b
  t = a % b;
  return t ? gcd(b, t) : b;
}

export function lcm(a: number, b: number) {
  return a / gcd(a, b) * b;
}
