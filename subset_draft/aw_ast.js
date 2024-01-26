// testing https://github.com/acornjs/acorn which includes
// the ast walker https://github.com/acornjs/acorn/tree/master/acorn-walk/
// testing with bun

const acorn = require('acorn');
const walk = require('acorn-walk');

const parse = (prog) => acorn.parse(prog, {ecmaVersion: 2023});
const PROGRAM_T = 'Program';

const testToAST = () => {

    console.log('start');

    const TERM = 'x => x + 2';
    // const fMap = {
    //     'Literal': (node, state, c) => {
    //         console.log(`Literal node is '${node.raw}'`);
    //         c(node, state);
    //     },
    //     'NewExpression': (node, state, c) => {
    //         console.log(`Ternary node is`)
    //     },
    //     'Expression': (node, state, c) => {
    //         console.log(`Expression node is`);
    //     }
    // }

    const fMap = {
        'Literal': (node, state, c) => {
            console.log(`${state}Literal node is ${node.raw}`);
        },
        'Expression': (node, state, c) => {
            console.log(`${state}Expression is ${node.type}`);
            c(node, state + `   `);
        },
        'Function': (node, state, c) => {
            console.log(`${state}Function takes ${JSON.stringify(node.params)}`);
            //c(node, state + `   `);
        }
    }

    // const walker = walk.make(fMap);

    walk.recursive(parse(TERM), ``, fMap, undefined);

    // walk.ancestor()

    let program = {};
    walk.full(parse('let x = 1;'), (node) => {
        if(node.type === PROGRAM_T){
            program = node;
        }
    });

    const runtimeType = Math.random() - 0.5 <= 0 ? () => {} : 0;  // this is actually a union type effectively 

    console.log(runtimeType);

    console.log(typeof({}));

    const treePrinter = (treeObj) => {
        if(treeObj.body !== undefined){
            
        }
    };


}

export const toASTTree = (program) => {

    let tree = {};
    walk.full(parse(program), (node) => {
        if(node.type === PROGRAM_T){
            tree = node;
        }
    });

    return tree;
}



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
