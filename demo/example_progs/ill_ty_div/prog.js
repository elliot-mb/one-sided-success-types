const mul = n => m => {
    const nNext = n - 1;
    return mul(nNext)(m);
}
const twoInfinityAndBeyond = mul(2)(3);