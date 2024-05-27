const fst = s => t => s;
const snd = s => t => t;
const pair = s => t => p => p(s)(t);
const p1 = pair(0)(1);
const p2 = pair(2)(3);
const zipSumPairs = pair1 => pair2 => {
    const e1 = pair1(fst) + pair2(fst);
    const e2 = pair1(snd) + snd(pair2);
    return pair(e1)(e2);
}
const sumPair = zipSumPairs(p1)(p2);