import {Utils} from './utils.js';
import {toASTTree, getSubterm, termShape} from './aw_ast.js';
import {GenT, NumT, ArrowT} from './typevar.js';
import {Constraint} from './constraint.js';
import {ConstraintSet} from './constraint_set.js';
import {EmptyJudgement, Judgement} from './judgement.js';
import {Term} from './term.js';

export class Reconstructor{

    constructor(){ //making a new one just resets the variable names (but there are an infinite number anyway)
        this.lastUsedVar = String.fromCharCode(Utils.firstCharCode);
    } 

    //                           single type string   strings[] of type equations
    static TCPair = (type, constr) => ({'type': type, 'constraints': constr});
    //const TCPairAppend = (TCPair) => 

    rstFreshVar(){
        this.lastUsedVar = String.fromCharCode(Utils.firstCharCode);
    }

    getFreshVar(pfix) {
        this.lastUsedVar = Utils.nextFreeTypeName(this.lastUsedVar);
        return `${pfix}${this.lastUsedVar}`;
    }

    /**
     * regular non-success type checker
     * @param {*} EmptyJudgement Γ ⊢ M 
     * @returns {*} Judgement object 
     */
    typecheck(eJudge){
        //console.log(eJudge.show());
        //these embody the constraint rules
        if(eJudge.shape === 'x'){ //CTVar
            // side condition ::= x : T \in assms
            // conclusion of the rule ::= assms \types x : T | {}
            return eJudge.constrain(eJudge.variableType(eJudge.getSubterm('x')));
            
            // if(assms[letter] === undefined) throw `typecheck: term of shape ${shape}, variable '${letter}' is free; unbound in function`
            // //conclusion of the rule ::= assms \types x : T | {}
            // return Reconstructor.TCPair(assms[letter], new ConstraintSet()); 
        }
        if(eJudge.shape === 'n'){ //CTNum
            //conclusion of the rule ::= assms \types n : Num | {}
            return eJudge.constrain(new NumT());

            //return Reconstructor.TCPair(new NumT(), new ConstraintSet()); 
        }
        if(eJudge.shape === 'M o N'){ //CTNumOp

            const premise1 = this.typecheck(eJudge.asSubterm('M'));
            const premise2 = this.typecheck(eJudge.asSubterm('N'));

            const conclusn = eJudge.constrain(new GenT(this.getFreshVar('X')));
            conclusn.union(premise1.constrs);
            conclusn.union(premise2.constrs);
            conclusn.unionSingle(new Constraint(premise1.type, new NumT()));
            conclusn.unionSingle(new Constraint(premise2.type, new NumT()));
            conclusn.unionSingle(new Constraint(conclusn.type, new NumT()));

            return conclusn;

            // //left premise
            // const t1 = getSubterm(term, 'M');
            // const T1_C = this.typecheck(t1, assms); //constraints
            // //right premise
            // const t2 = getSubterm(term, 'N');
            // const T2_C = this.typecheck(t2, assms); //constraints
            // //make conclusion
            // let X = new GenT(this.getFreshVar('X')); //num constraint
            // const constrs = new ConstraintSet([
            //     new Constraint(T1_C.type, new NumT()),
            //     new Constraint(T2_C.type, new NumT()),
            //     new Constraint(X, new NumT())
            // ]);            
            // constrs.combine(T1_C.constraints);
            // constrs.combine(T2_C.constraints);
            // //conclusion | constraints
            // return Reconstructor.TCPair(X, constrs);
        }
        if(eJudge.shape === '[M, N]'){        
            throw 'implement me!';
        }
        if(eJudge.shape === 'x => M'){ //CTAbsInf
            const X = new GenT(this.getFreshVar('X'));
            const body = eJudge.asSubterm('M');
            body.addAssm(eJudge.asSubterm('x').getSubterm('x'), X);
            const premise1 = this.typecheck(body);

            return eJudge.constrain(new ArrowT(X, premise1.type), premise1.constrs);

            //premise 
            // const t2 = getSubterm(term, 'M');
            // let X = new GenT(this.getFreshVar('X'));
            // const xName = getSubterm(getSubterm(term, 'x'), 'x'); //add to assms
            // const newAssms = assms;
            // newAssms[xName] = X;
            // //generate constraitns
            // const T2_C = this.typecheck(t2, newAssms);
            // //conclusion | constraints 
            // return Reconstructor.TCPair(new ArrowT(X, T2_C.type), T2_C.constraints);
        }
        if(eJudge.shape === 'M(N)'){ //CTApp
            const X = new GenT(this.getFreshVar('X'));
            const premise1 = this.typecheck(eJudge.asSubterm('M'));
            const premise2 = this.typecheck(eJudge.asSubterm('N'));

            const conclusn = eJudge.constrain(X);
            conclusn.union(premise1.constrs);
            conclusn.union(premise2.constrs);
            conclusn.unionSingle(new Constraint(premise1.type, new ArrowT(premise2.type, X)));
            return conclusn;
            
            // const t1 = getSubterm(term, 'M');
            // const t2 = getSubterm(term, 'N');
            // const T1_C = this.typecheck(t1, assms);
            // const T2_C = this.typecheck(t2, assms);
            // let X = new GenT(this.getFreshVar('X'));
            // const constrs = new ConstraintSet([
            //     new Constraint(T1_C.type, new ArrowT(T2_C.type, X))
            // ]);
            // constrs.combine(T1_C.constraints);
            // constrs.combine(T2_C.constraints);
            // return Reconstructor.TCPair(X, constrs);
        }
        if(eJudge.shape === 'M <= 0 ? N : P'){ //IfLez
            const X = new GenT(this.getFreshVar('X'));
            const premise1 = this.typecheck(eJudge.asSubterm('M'));
            const premise2 = this.typecheck(eJudge.asSubterm('N'));
            const premise3 = this.typecheck(eJudge.asSubterm('P'));

            const conclusn = eJudge.constrain(X);
            conclusn.union(premise1.constrs);
            conclusn.union(premise2.constrs);
            conclusn.union(premise3.constrs);
            conclusn.unionSingle(new Constraint(premise1.type, new NumT()));
            conclusn.unionSingle(new Constraint(premise2.type, X));
            conclusn.unionSingle(new Constraint(premise3.type, X));
            return conclusn;

            // const t0 = getSubterm(term, 'M');
            // const t1 = getSubterm(term, 'N');
            // const t2 = getSubterm(term, 'P');
            // const X = new GenT(this.getFreshVar('X'));
            // const T0_C = this.typecheck(t0, assms);
            // const T1_C = this.typecheck(t1, assms);
            // const T2_C = this.typecheck(t2, assms);
            // const constrs = new ConstraintSet([
            //     new Constraint(T0_C.type, new NumT()),
            //     new Constraint(T1_C.type, X),
            //     new Constraint(T2_C.type, X)
            // ]);
            // constrs.combine(T0_C.constraints);
            // constrs.combine(T1_C.constraints);
            // constrs.combine(T2_C.constraints);
            // return Reconstructor.TCPair(X, constrs);
        }
        throw `typecheck: eJudge has an unrecognised shape`;
    }

    unify(topType, cSet){
        while(!cSet.isEmpty()){
            const c = cSet.pop();
            ////console.log(`constraints ${cSet.show()}`)
            ////console.log(`this constraint ${c.show()}`);
            ////console.log(`replace in ${topType.show()}`);
            if(c.isLhsEqRhs()){}
            else if(c.isLhsNotInFreeRhs()){
                ////console.log(`1replace ${c.lhs().show()} with ${c.rhs().show()}`);
                topType = topType.swapWith(c.lhs(), c.rhs());
                cSet.swapWithAll(c.lhs(), c.rhs());
            }
            else if(c.isRhsNotInFreeLhs()){
                ////console.log(`2replace ${c.rhs().show()} with ${c.lhs().show()}`)
                topType = topType.swapWith(c.rhs(), c.lhs());
                cSet.swapWithAll(c.rhs(), c.lhs());
            }
            else if(c.areRhsLhsArrows()){
                ////console.log(`3corrolate ${c.rhs().show()} and ${c.lhs().show()}`);
                cSet.add(new Constraint(c.rhs().getA(), c.lhs().getA()));
                cSet.add(new Constraint(c.rhs().getB(), c.lhs().getB()));
            }else{
                const l = c.lhs();
                const r = c.rhs();
                Utils.downgradeTypes(l);
                Utils.downgradeTypes(r);
                throw `Reconstructor.unify: failed to unify with constraint '${new Constraint(l, r).show()}'`;
            }
        }
        return topType;
    }

    reconstruct(program){
        this.rstFreshVar();
        // console.log(toASTTree(program));
        const empty = new EmptyJudgement(toASTTree(program));
        
        // console.log(empty.show());
        const full = this.typecheck(empty);
        const roughType = full.type;
        const constraintSet = full.constrs;
        // ////console.log(`rough type ${principalType.show()}`);
        const unifiedType = this.unify(roughType, constraintSet);
        Utils.downgradeTypes(unifiedType);
        return unifiedType;
    }
}