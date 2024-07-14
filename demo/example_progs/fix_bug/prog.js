const pair = m => n => p => p(m)(n);
const getQuot = s => t => s;
const getRmdr = s => t => t;
const intDivide = n => d => q => {
    const r = n - d;
    return r + 1 <= 0
        ? pair(q)(n)
        : intDivide(r)(d)(q + 1);
}
const quot = intDivide(120)(getQuot)(10);