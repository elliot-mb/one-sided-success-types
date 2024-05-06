const id = x => x;
const mightFail = x => {
    return x <= 0 ? 1 : 2(3);
}
const guardFail = x => {
    return (y => y) + x ? 1 : 2;
}
const willFail = x => {
    return x <= 0 ? (0 <= 0 ? 0(0) : 0(0)) : id + id; 
}
const mgw = mightFail(guardFail(willFail));
const gmw = guardFail(mightFail(willFail));
const wgm = willFail(guardFail(mightFail));
const mNum = mightFail(0-1);
const gNum = guardFail(0); 
const wNum = willFail(0);  