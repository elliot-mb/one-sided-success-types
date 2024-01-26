import {toASTTree} from './aw_ast.js';

/**
 * the tiny subset of the language that just includes variables,
 * functions, pairs and two operators (they are infix)
 * 
 * simple grammar
 * where n and m floating point values
 * 
 * values
 * V, W ::= x | n | [V, W] | x => M
 * 
 * terms
 * M, N ::= x | n | n + m | n - m | [M, N] | 
 *          x => M | M(N) | M <= 0 ? N : P 
 * 
 * 
 * f => (x => f(v => x(x)(v)))(x => f(v => x(x)(v))) --i can have recursion with the Z combinator
 * 
 * 
 * evaluation contexts 
 * (where you can put values to have the term evaluate)
 * E, F ::= [] | (x => M) E | E(N) | E + m | E - m |
 *          n + E | n - E | E <= 0 ? N : P 
 * 
 * binary relation on evaluations
 * s <= 0 ? N : P |> N --where s is less than or equal to zero
 * t <= 0 ? N : P |> P --where t is greater than zero
 * n + m |> u --where u is the sum of n and m
 * n - m |> v --where v is n subract m
 * (x => M)V |> M[V/x]
 * 
 * types 
 * A, B ::= number | A x B | A -> B | A^c | Ok | A v B --note the union type
 * 
 * term to ast obj correspondence
 * 
 * n
 * {"type":"Literal",
 *  "start":<number>,
 *  "end":<number>,
 *  "value":n,
 *  "raw":"n" --where n is the value of n as a string 
 * }
 * 
 * n + m
 * {"type":"BinaryExpression",
 *  "start":0,
 *  "end":5,
 *  "left":{n},
 *  "operator":"+", --(replace + for - for subtractions)
 *  "right":{m}
 * }
 * 
 * [M, N]
 * {"type":"ArrayExpression",
 *  "start":<number>,
 *  "end":<number>,
 *  "elements":[{M},{N}]
 * }
 * 
 * x => M
 * {"type":"ArrowFunctionExpression",
 *  "start":<number>,
 *  "end":<number>,
 *  "id":null, -- this is null because the function is anonymous
 *  "expression":true,
 *  "generator":false,
 *  "async":false,
 *  "params":[{"type":"Identifier","start":<number>,"end":<number>,"name":"x"}],
 *  "body":{M}
 *  }
 * 
 * M(N)
 * {"type":"CallExpression",
 *  "start":0,
 *  "end":11,
 *  "callee":{M},
 *  "arguments":[N],
 *  "optional":false
 * } 
 *
 * M <= 0 ? N : P
 * {"type":"ConditionalExpression",
 *  "start":0,
 *  "end":14,
 *  "test":{
 *      "type":"BinaryExpression",
 *      "start":<number>,
 *      "end":<number>,
 *      "left":{M},
 *      "operator":"<=",
 *      "right":{
 *          "type":"Literal",
 *          "start":<number>,
 *          "end":<number>,
 *          "value":0,
 *          "raw":"0"}
 *      },
 *  "consequent":{N},
 *  "alternate":{P}
 * }
 * 
 * satisfaction
 * 
 */

/**
 * example values
 */
{x => x + 1}
{0}
{[0, x => x]}

// testing AST correspondences
const showProg = (program) => console.log(JSON.stringify(toASTTree(program)));

// showProg('1 <= 0 ? 2 : 3');

/**
 * example terms 
 */
{1 + 2}
{0}
{(x => x)}
{(x => x + 1)(4)}
{(1 - 2) <= 0 ? (x => y => y(x)) : (x => z => z(x)(x))}

// crashing terms

/**
 * what do we consider ill-typed? (successful typing as OK^c, what 'doesnt evaluate')
 * - undefined (indicative of nonexistant method call etc.)
 * - type conversion (usually undesirable)
 * - type coersion (usually undesirable or inconsistent)
 * - NaN (usually undesirable indicative of incorrect use of numericalj operator)
 * - a crash (getting stuck, going wrong)
 * - divergence
 */

console.log(1 - (x => x)); //NaN
console.log(1 + (x => x)); //type conversion (to string)
console.log((x => x)()); //undefined
console.log((y => y + 2)([0, 2])) //type conversion (to string)
console.log((f => (x => f(x(x)))(x => f(x(x))))(y => y)) //call stack size exceeded (divergence)

const Y = f => (x => f(x(x)))(x => f(x(x)));
const Z = f => (x => f(v => x(x)(v)))(x => f(v => x(x)(v)));
const add = f => x => y => y <= 0 ? x : (f(x + 1)(y - 1));
const addFix = Z(add); //recursion is real! 

console.log(addFix(2)(20));