const block1 = a => {
    const block2 = x => {
        const block3 = y => {
            return x(y);
        }
        return block3(a);
    };
    return block2(a);
}
const twice = f => f(f);
const succ = x => x + 1;
const succ2 = block1(succ);
const succSucc = twice(succ);
// succ(0)(0); yet we can prove this is wrong
succ(succ); //an interesting thing to not be able to prove! 
succ(succ)(0)(0)(0); //an interesting thing to not be able to prove! 