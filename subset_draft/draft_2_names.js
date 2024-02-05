/**
 * 
 * 
 * attempt to extend the pcf like language with blocks and let-rec-like defintions 
 * 
 * values
 * V, W ::= x | n | POSSIBLY REMOVE PAIRS [V, W] | x => M (| null | const f = V;) (extension)
 * 
 * terms
 * M, N ::= x | n | n + m | n - m | POSSIBLY REMOVE PAIRS [M, N] | x => M | M(N) | M <= 0 ? N : P (| const f = M; N | null) (extension)
 * 
 * 
 * (extension)
 * the introduction of definitions means that all the M functions need their
 * own local scope and thus definition set, where a definition set is 
 * 
 * Defs ::= Defs; f = M | epsilon 
 * Defs may be appended with the function name where it is local to the function:
 * e.g. Defs_f would be the defintions M can see when 'const f = M' is typed.
 * a new definition Defs_f set begins in M for 'const f = M; N', 
 * which is always at least Defs_f = {f = M} for recursion
 * 
 * the introduction of null allows functions to return nothing without using undefined (crash)
 * 
 * f => (x => f(v => x(x)(v)))(x => f(v => x(x)(v))) --i can have recursion with the Z combinator
 * we define this with Z ::= f => (x => f(v => x(x)(v)))(x => f(v => x(x)(v)));
 * 
 * 
 * 
 * evaluation contexts 
 * (where you can put values to have the term evaluate)
 * E, F ::= [] | (x => M)(E) | E(N) | E + m | E - m |
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
 * A, B ::= Num | A x B | A -> B | A^c | Ok 
 * 
 * constant types 
 * Cs = { <= 0 ?: Num -> A -> A -> A,  } --the branches must have the same type 
 * because it will require many more rules to reason with the type otherwise
 * 
 * things i can  do 
 * - read up on one-sided type inference (book suggested)
 * - read up on names in lambda calculus (notes suggested)
 * - learn about cons and constructor types 
 * 
 */

import {toASTTree, pretty, getSubterm, checkGrammar, termShape, typeToGrammar} from './aw_ast.js';
import {GenT, NumT, ArrowT} from './typevar.js';
import {Constraint} from './constraint.js';
import {ConstraintSet} from './constraint_set.js';

// regular one-sided implementation BEFORE i implement 
// the success system (adding extra rules for OK(^c))

//                           single type string   strings[] of type equations
const TCPair = (type, constr) => ({'type': type, 'constraints': constr});
//const TCPairAppend = (TCPair) => 

let counter = 0;
const max = 100;
const getCounter = () => {counter++; return counter % max;}

const freshVar = Array(max).fill(1).map((v, i) => `_${i}`);
const getFreshVar = (pfix) => `${pfix}${freshVar[getCounter()]}`;

/**
 * regular non-success type checker
 * @param {*} term 
 * @param {*} assms is a json from identifiers (x) to types (strings)
 * 
 * @returns {the type, the constraints as an array of equation strings}
 */
const typecheck = (term, assms) => {
    const shape = termShape(term);
    if(shape === 'x'){
        return TCPair(assms[getSubterm(term, 'x')], []);
    }
    if(shape === 'n'){
        return TCPair('Num', []);
    }
    if(shape === 'n + m | n - m'){
        throw 'implement me!';
    }
    if(shape === '[M, N]'){        throw 'implement me!';
    }
    if(shape === 'x => M'){
        const t2 = getSubterm(term, 'M');
        const T1 = getFreshVar('T');
        const xName = getSubterm(getSubterm(term, 'x'), 'x');
        const newAssms = assms;
        newAssms[xName] = T1;
        const T2_C = typecheck(t2, newAssms);
        return TCPair(`${T1} -> ${T2_C.type}`, T2_C.constraints);
    }
    if(shape === 'M(N)'){
        const t1 = getSubterm(term, 'M');
        const t2 = getSubterm(term, 'N');
        const T1_C = typecheck(t1, assms);
        const T2_C = typecheck(t2, assms);
        const X = getFreshVar('X');
        
        return TCPair(X, [...T1_C.constraints, ...T2_C.constraints, `${T1_C.type} = ${T2_C.type} -> ${X}`]);
    }
    if(shape === 'M <= 0 ? N : P'){
        
    }
}

const unify = (topType, cSet) => {
    while(!cSet.isEmpty()){
        const c = cSet.pop();
        if(c.isLhsEqRhs()){}
        else if(c.isLhsNotInFreeRhs()){
            console.log(`replace ${c.lhs().show()} with ${c.rhs().show()}`);
            topType.swapWith(c.lhs(), c.rhs());
            cSet.swapWithAll(c.lhs(), c.rhs());
        }
        else if(c.isRhsNotInFreeLhs()){
            console.log(`replace ${c.rhs().show()} with ${c.lhs().show()}`)
            topType.swapWith(c.rhs(), c.lhs());
            cSet.swapWithAll(c.rhs(), c.lhs());
        }
        else if(c.areRhsLhsArrows()){
            console.log(`corrolate ${c.rhs().show()} and ${c.lhs().show()}`);
            cSet.add(new Constraint(c.rhs().getA(), c.lhs().getA()));
            cSet.add(new Constraint(c.rhs().getB(), c.lhs().getB()));
        }else{
            console.log(`fail`);
            return topType;
        }
    }
    return topType;
}

const testTypeCheck = () => {
    console.log(typecheck(toASTTree('s => y => z => (s(z))(y(z))'), {}));
}

const testTypeVar = () => {
    const numA = new NumT('A');
    const numB = new NumT('B');
    const generalA = new GenT('E');
    const generalF = new GenT('F');
    console.log(numA.freeIn());
    const arrA = new ArrowT(generalF, generalA, 'C');
    console.log(arrA.show());
    const arrB = new ArrowT(generalF, generalF, 'D');
    console.log(arrA.show());
    console.log(arrA.freeIn());
    const cstr = new Constraint(numB, arrB);
    console.log(cstr.lhs().freeIn());
    console.log(`${cstr.show()} is ${cstr.isLhsEqRhs()}`);

    const T1 = new GenT('H');
    const T2 = new GenT('I');
    const T3 = new GenT('C');
    const T4 = new GenT('J');
    const T5 = new GenT('K');
    const T6 = new GenT('L');
    const X4 = new GenT('M');
    const X5 = new GenT('B');
    const X6 = new GenT('A');
    const X5_X6 = new ArrowT(X5, X6, 'none');
    const C1 = new Constraint(T1, new ArrowT(T3, X4, 'none'));
    const C2 = new Constraint(T2, new ArrowT(T3, X5, 'none'));
    const C3 = new Constraint(X4, new ArrowT(X5, X6, 'none'));
    const constrSet = new ConstraintSet([C1, C2, C3]);
    const topType = new ArrowT(T1, new ArrowT(T2, new ArrowT(T3, X6)));
    unify(topType, constrSet);
    console.log('x => y => z => (x(z))(y(z)) has type : ' + topType.show());

}

testTypeCheck();
testTypeVar();
