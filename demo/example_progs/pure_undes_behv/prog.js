const nil = 0;
const list = s => t => p => p(s)(t);
const head = s => t => s;
const tail = s => t => t;
const vecA =
list(0)(list(1)(list(2)(list(3)(list(4)(nil)))));
const vecB =
list(1)(list(6)(list(7)(list(13)(list(20)(nil)))));
const mulPos = n => m => n - 1 <= 0
    ? n <= 0
        ? 0
        : m
    : m + mulPos(n - 1)(m);
const dotPos = a => b => {
    return a <= 0
        ? 0
        : mulPos(a(head))(b(head)) + dotPos(a(tail))(b(tail));
}
dotPos(vecA)(vecB);