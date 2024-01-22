// testing https://github.com/acornjs/acorn which includes
// the ast walker https://github.com/acornjs/acorn/tree/master/acorn-walk/
// testing with bun

const PROGRAM_T = 'Program';

console.log('start');
const acorn = require('acorn');
const walk = require('acorn-walk');

const parse = (prog) => acorn.parse(prog, {ecmaVersion: 2023});

// walk.simple(parse('let x = 10; let y = 100;'), {
//     Literal(node){
//         console.log(`Found a literal: ${node.value}`);
//     }
// });

let program = {}; //where we write the last call

walk.full(parse('let x = 1;'), (node) => {
    if(node.type === PROGRAM_T){
        program = node;
    }
});

console.log(program);

// // recursive so we pass it printNode
// const printNode = (f, node, depth) => {
//     if(node.type === PROGRAM_T){
//         console.log(`${PROGRAM_T}`);
//         map(child => f(f, child, depth + 1), node.body);
//         return;
//     }

// };

// const printProgram = (p) => printNode(printNode, p, 0);

// gives a format like 
// Node {
//   type: "Program",
//   start: 0,
//   end: 9,
//   body: [
//     Node {
//       type: "ExpressionStatement",
//       start: 0,
//       end: 4,
//       expression: // Node {
    //     type: "ExpressionStatement",
    //     start: 5,
    //     end: 9,
    //     expression: Node {
    //       type: "BinaryExpression",
    //       start: 5,
    //       end: 8,
    //       left: Node {
    //         type: "Literal",
    //         start: 5,
    //         end: 6,
    //         value: 1,
    //         raw: "1",
    //       },
    //       operator: "+",
    //       right: Node {
    //         type: "Literal",
    //         start: 7,
    //         end: 8,
    //         value: 2,
    //         raw: "2",
    //       },
    //     },
    //   }
//     }, Node {
//       type: "ExpressionStatement",
//       start: 5,
//       end: 9,
//       expression: [Object ...],
//     }
//   ],
//   sourceType: "script",
// }




