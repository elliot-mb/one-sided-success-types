/**
 * 
 * 
 * attempt to extend the pcf like language with blocks and let-rec-like defintions 
 * 
 * values
 * V, W ::= x | n | POSSIBLY REMOVE PAIRS [V, W] | x => M (| null | const f = V;) (extension)
 * 
 * terms
 * M, N ::= x | n | M + N | M - N | POSSIBLY REMOVE PAIRS [M, N] | x => M | M(N) | M <= 0 ? N : P (| const f = M; N | null) (extension)
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

import { toASTTree } from './wrapper_acorn.js';
import { GenT, NumT, ArrowT, OkT, CompT } from './typevar.js';
import { Constraint } from './constraint.js';
import { ConstraintSet } from './constraint_set.js';
import { Utils } from './utils.js';
import { Reconstructor } from './reconstructor.js';
import {showsTree} from './wrapper_acorn.js';
import { Orer } from './orer.js';
import { Ander } from './ander.js';

const testTypeCheck = () => {
    console.log(typecheck(toASTTree('s => y => z => (s(z))(y(z))'), new ConstraintSet()).constraints.show());
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

    //  manually testing the constraint solver with the manually written output from 
    //  the constraint generator (next step is auto generating these with it)

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

const combinedTest = () => {
    // const program = 'f => x => f(f(x))';
    // const tcPair = typecheck(toASTTree(program), new ConstraintSet());
    // const principalType = tcPair.type;
    // const constraintSet = tcPair.constraints;
    // // console.log(`rough type ${principalType.show()}`);
    // const pType = unify(principalType, constraintSet);
    // console.log(`${program} : ${pType.show()}`);
}

const swapTest = () => {
    let A = new GenT('A');
    const B = new GenT('B');
    A = A.swapWith(A, B);
    console.log(A.show());
}

const rolloverTest = () => {
    let t = 'A';
    for (let i = 0; i < 26 * 26; i++) {
        t = Utils.nextFreeTypeName(t);
        console.log(t);
    }

}

const downgradeTest = () => {
    const r = new Reconstructor();
    const programs = ['x => y => (0 + 1 - x(0) <= 0 ? x : y)'];
    console.log(`${programs[0]} : ${r.reconstruct(programs[0]).show()}`);
    // const s = new Reconstructor();
    // const programS = '(x => x)(0)';
    // console.log(`${programS} : ${s.reconstruct(programS).show()}`);
}

const bulkTest = () => {
    const r = new Reconstructor();
    const programs = [
        'f => x => f(f(x))',
        'x => y => (0 + 1 - x(0) <= 0 ? x : y)',
        'x => x',
        '2 - 1',
        'f => x => f(f(x))',
        'f => g => x => f(g(x))',
        'x => 0',
        'x => x(y => y(0))(f => x => f(f(x)))',
        '(x => y => x(1.1) <= 0 ? x : y)(x => x + 1)(y => y)',
        '(z => z)(0 - 1) <= 0 ? x => y => y(x => 0) : z => w => w(w(z))',
        'z => z(z)'
    ];
    programs.map(p => console.log(`${p} :\n ${r.reconstruct(p).map(t => `\t${t.show()}\n`)}`));

}

const nullTest = () => {
    console.log(toASTTree('null'));
}

const orSetAndSetTest = () => {
    const o = new Orer(
        new Ander(new Constraint(new GenT('A'), new GenT('B')), new Constraint(new GenT('A'), new GenT('B'))),
        new Ander(new Constraint(new GenT('A'), new GenT('B')), new Constraint(new GenT('A'), new GenT('B'))));
    console.log(o.show());

}

const equalsTest = () => {
    let constr1 = new Constraint(new GenT('A'), new GenT('B')); 
    let constr2 = new Constraint(new GenT('A'), new GenT('B'));
    console.log(`'${constr1.show()}' === '${constr2.show()}' is ${constr1.equals(constr2)}`);
    constr1 = new Constraint(new GenT('B'), new GenT('B')); 
    constr2 = new Constraint(new GenT('A'), new GenT('B'));
    console.log(`'${constr1.show()}' === '${constr2.show()}' is ${constr1.equals(constr2)}`);
    constr1 = new Constraint(new GenT('A'), new ArrowT(new GenT('B'), new GenT('B'))); 
    constr2 = new Constraint(new GenT('A'), new GenT('B'));
    console.log(`'${constr1.show()}' === '${constr2.show()}' is ${constr1.equals(constr2)}`);
    constr1 = new Constraint(new GenT('A'), new ArrowT(new GenT('B'), new GenT('B'))); 
    constr2 = new Constraint(new GenT('A'), new ArrowT(new GenT('B'), new GenT('B')));
    console.log(`'${constr1.show()}' === '${constr2.show()}' is ${constr1.equals(constr2)}`);
    constr1 = new Constraint(new GenT('A'), new ArrowT(new GenT('B'), new GenT('B'))); 
    constr2 = new Constraint(new GenT('B'), new ArrowT(new GenT('A'), new GenT('A')));
    console.log(`'${constr1.show()}' === '${constr2.show()}' is ${constr1.equals(constr2)}`); //its a strict equals on the identifiers, too
    constr1 = new Constraint(new OkT(), new GenT('B')); 
    constr2 = new Constraint(new OkT(), new GenT('B'));
    console.log(`'${constr1.show()}' === '${constr2.show()}' is ${constr1.equals(constr2)}`);
}

const removeRepeatsTest = () => {
    const isRepeated = (xs, test, i) => {
        return Utils.any(xs.map((x, j) => i !== j && x.equals(test)));
    };

    const types = [
        new OkT(),
        new ArrowT(new GenT('A'), new GenT('BC')),
        new GenT('A'),
        new GenT('D'),
        new GenT('E'),
        new NumT(),
        new ArrowT(new GenT('A'), new GenT('B')),
        new ArrowT(new GenT('C'), new GenT('B')),
        new ArrowT(new GenT('A'), new GenT('B')),
        new OkT(),
        new OkT(),
        new NumT(),
        new NumT(),
        new OkT()
    ];

    const types2 = [
        new OkT(),
        new ArrowT(new GenT('A'), new GenT('BC')),
        new GenT('A'),
        new GenT('D'),
        new GenT('E'),
        new NumT(),
        new ArrowT(new GenT('A'), new GenT('B')),
        new ArrowT(new GenT('C'), new GenT('B')),
        new ArrowT(new GenT('A'), new GenT('B')),
        new OkT(),
        new OkT(),
        new NumT(),
        new NumT(),
        new OkT()
    ];


    console.log(Utils.removeRepeats(types2).map(t => t.show()));

    for(let i = 0; i < types.length; i++){
        const t = types[i]
        const repeats = isRepeated(types, t, i);
        if(repeats){
            types.splice(i, 1);
            i--;
        }
    }

    console.log(types.map(t => t.show()));
}   

const compTest = () => {
    const compType = new CompT(new ArrowT(new CompT(new OkT()), new GenT('A')));
    console.log(compType.show());
}

// testTypeCheck();
// testTypeVar();
//combinedTest();
//downgradeTest();
//swapTest();
//rolloverTest();
//equalsTest();
// bulkTest();
compTest();
//removeRepeatsTest();
//orSetAndSetTest();

//nullTest();

//showsTree('nullTree', 'null');
/**
 * adding 'null' to our language would look like this! 
 * 
 * {
  "type": "Literal",
  "start": 0,
  "end": 4,
  "value": null,
  "raw": "null"
}
 * updating the json files accordingly... its another lite
 */