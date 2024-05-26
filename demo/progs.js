// const eq0Else1 = a => b => {
//     return a - b <= 0 ? b - a <= 0 ? 0 : 1 : 1;
// }

// const gcd = a => b => {
//     const diff = a - b;
//     const largest = diff <= 0 ? b : a;
//     const smallest = diff <= 0 ? a : b;
//     const next = largest - smallest; 
//     return eq0Else1(a)(b) <= 0 ? a : gcd(next)(smallest);
// }

// console.log(gcd(63)(14));

// const nil = 0;
// const list = s => t => p => p(s)(t);
// const head = s => t => s;
// const tail = s => t => t;
// const vecA = list(0)(list(1)(list(2)(list(3)(list(4)(nil)))));
// const vecB = list(1)(list(6)(list(7)(list(13)(list(20)(nil)))));
// const mulPos = n => m => n - 1 <= 0 ? n <= 0 ? 0 : m : m + mulPos(n - 1)(m);
// const dotPos = a => b => {
//     return a <= 0 ? 0 : mulPos(a(head))(b(head)) + dotPos(a(tail))(b(tail));
// }
// dotPos(vecA)(vecB);


// const stop = 0;  
// const treeNode = lft => val => rgt => lftValRgt => lftValRgt(lft)(val)(rgt);
// const emptyTree = val => treeNode(stop)(val)(stop);
// const pft120 = treeNode
//     (treeNode
//         (emptyTree(3))
//         (12)
//         (treeNode
//             (emptyTree(2))
//             (4)
//             (emptyTree(2))))
//     (120)
//     (treeNode
//         (emptyTree(5))
//         (10)
//         (emptyTree(2)));
// const rgt = t => u => v => t;
// const lft = t => u => v => v;
// const val = t => u => v => u;
// const factorRLRVal = pft120(rgt)(lft)(rgt)(val);
// const factorRLRLVal = pft120(rgt)(lft)(rgt)(val)(0);

// const pair = m => n => p => p(m)(n);
// const getQuot = s => t => s;
// const getRmdr = s => t => t;
// const intDivide = n => d => q => {
//     const r = n - d; 
//     return r + 1 <= 0 ? pair(q)(n) : intDivide(r)(d)(q + 1);
// }
// const quot = intDivide(120)(10)(0)(getQuot);

// const mul = n => m => {
//     const next = n - 1;
//     return m + mul(next)(m); //forgotten conditional?
// }
// const twoInfinityAndBeyond = mul(2)(3);


// const treeNode = lft => val => rgt => lftValRgt => lftValRgt(lft)(val)(rgt);
// const pft120 = treeNode
//     (treeNode
//                 (3)
//             (12)
//     (treeNode       (2)
//                 (4)
//                     (2)))
//         (120)
//     (treeNode   (5)
//             (10)
//                 (2));
// const lft = t => u => v => v;
// const rgt = t => u => v => t;
// const factorLR = pft120(lft)(rgt); //5
// const factorRLR = pft120(rgt)(lft)(rgt); //2



// console.log(factorLR);
// console.log(factorRLR);
// const mulNat = n => m => {
//     const nn = n - 1;
//     return nn <= 0 ? n <= 0 ? 0 : m : m + mulNat(nn)(m);
// } 
// mulNat(0)(0); //0 
// mulNat(2)(5); //10
// console.log(mulNat(239)(458)); //109462

// (x => x)(x => x)(x => x);

// // // const id = x => x;
// const treeNode = lft => val => rgt => lftValRgt => lftValRgt(lft)(val)(rgt);
// const lft = t => u => v => v;
// const rgt = t => u => v => t;
// const pft120 = treeNode
//     (treeNode
//                 (3)
//             (12)
//     (treeNode       (2)
//                 (4)
//                     (2)))
//         (120)
//     (treeNode   (5)
//             (10)
//                 (2))(rgt)(lft)(rgt);
