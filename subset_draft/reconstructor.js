import {Utils} from './utils.js';
import {toASTTree, getSubterm, termShape} from './aw_ast.js';
import {GenT, NumT, ArrowT} from './typevar.js';
import {Constraint} from './constraint.js';
import {ConstraintSet} from './constraint_set.js';

export class Reconstructor{

    constructor(){ //making a new one just resets the variable names (but there are an infinite number anyway)
        this.lastUsedVar = String.fromCharCode(Utils.firstCharCode);
    }

    //                           single type string   strings[] of type equations
    static TCPair = (type, constr) => ({'type': type, 'constraints': constr});
    //const TCPairAppend = (TCPair) => 

    getFreshVar(pfix) {
        this.lastUsedVar = Utils.nextFreeTypeName(this.lastUsedVar);
        return `${pfix}${this.lastUsedVar}`;
    }

    /**
     * regular non-success type checker
     * @param {*} term 
     * @param {*} assms is a json from identifiers (x) to types (strings)
     * 
     * @returns {the type, the constraints as an array of equation strings}
     */
    typecheck(term, assms){
        const shape = termShape(term);
        if(shape === 'x'){
            let letter = getSubterm(term, 'x');
            if(assms[letter] === undefined) throw `typecheck: term of shape ${shape}, variable '${letter}' is free; unbound in function`
            return Reconstructor.TCPair(assms[letter], new ConstraintSet());
        }
        if(shape === 'n'){
            return Reconstructor.TCPair(new NumT(), new ConstraintSet());
        }
        if(shape === 'n + m | n - m'){
            throw 'implement me!';
        }
        if(shape === '[M, N]'){        
            throw 'implement me!';
        }
        if(shape === 'x => M'){
            const t2 = getSubterm(term, 'M');
            let T1 = new GenT(this.getFreshVar('T'));
            const xName = getSubterm(getSubterm(term, 'x'), 'x');
            const newAssms = assms;
            newAssms[xName] = T1;
            const T2_C = this.typecheck(t2, newAssms);
            return Reconstructor.TCPair(new ArrowT(T1, T2_C.type), T2_C.constraints);
        }
        if(shape === 'M(N)'){
            const t1 = getSubterm(term, 'M');
            const t2 = getSubterm(term, 'N');
            const T1_C = this.typecheck(t1, assms);
            const T2_C = this.typecheck(t2, assms);
            let X = new GenT(this.getFreshVar('X'));
            const arrowConstr = new Constraint(T1_C.type, new ArrowT(T2_C.type, X));
            const unionConstr = new ConstraintSet([arrowConstr]);
            unionConstr.combine(T1_C.constraints);
            unionConstr.combine(T2_C.constraints);
            //console.log(unionConstr.show());
            return Reconstructor.TCPair(X, unionConstr);
        }
        if(shape === 'M <= 0 ? N : P'){
            throw 'implement me!';
        }
    }

    unify(topType, cSet){
        while(!cSet.isEmpty()){
            const c = cSet.pop();
            console.log(`constraints ${cSet.show()}`)
            console.log(`this constraint ${c.show()}`);
            console.log(`replace in ${topType.show()}`);
            if(c.isLhsEqRhs()){}
            else if(c.isLhsNotInFreeRhs()){
                console.log(`1replace ${c.lhs().show()} with ${c.rhs().show()}`);
                topType = topType.swapWith(c.lhs(), c.rhs());
                cSet.swapWithAll(c.lhs(), c.rhs());
            }
            else if(c.isRhsNotInFreeLhs()){
                console.log(`2replace ${c.rhs().show()} with ${c.lhs().show()}`)
                topType = topType.swapWith(c.rhs(), c.lhs());
                cSet.swapWithAll(c.rhs(), c.lhs());
            }
            else if(c.areRhsLhsArrows()){
                console.log(`3corrolate ${c.rhs().show()} and ${c.lhs().show()}`);
                cSet.add(new Constraint(c.rhs().getA(), c.lhs().getA()));
                cSet.add(new Constraint(c.rhs().getB(), c.lhs().getB()));
            }else{
                throw `Reconstructor.unify: failed to unify with constraint '${c.show()}'`;
            }
        }
        return topType;
    }

    reconstruct(program){
        const typeAndConstraints = this.typecheck(toASTTree(program), new ConstraintSet());
        const roughType = typeAndConstraints.type;
        const constraintSet = typeAndConstraints.constraints;
        // console.log(`rough type ${principalType.show()}`);
        const unifiedType = this.unify(roughType, constraintSet);
        Utils.downgradeTypes(unifiedType);
        return unifiedType;
    }
}