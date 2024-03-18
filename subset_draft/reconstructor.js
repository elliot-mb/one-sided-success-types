import {Utils} from './utils.js';
import {toASTTree, getSubterm, termShape} from './wrapper_acorn.js';
import {Constraint} from './constraint.js';
import {ConstraintSet} from './constraint_set.js';
import {EmptyJudgement, Judgement} from './judgement.js';
import {Rule} from './rule.js';
import {Untypable} from './typevar.js';
import {Orer} from './orer.js';

export class Reconstructor{
    static type = 'reconstructor';

    constructor(){ //making a new one just resets the variable names (but there are an infinite number anyway)
        this.lastUsedVar = String.fromCharCode(Utils.firstCharCode);
        this.type = Reconstructor.type;
    } 

    rstFreshVar(){
        this.lastUsedVar = String.fromCharCode(Utils.firstCharCode);
    }

    /**
     * regular non-success type checker
     * @param {*} EmptyJudgement Γ ⊢ M 
     * @returns {*} Judgement object 
     */
    typecheck(empty){
        const maybeRule = Rule.appliesTo[empty.shape];
        if(maybeRule !== undefined){
            const full = maybeRule(this, empty);
            full.removeRepeats();
            return full;
        }
        throw Utils.makeErr(`typecheck: empty has an unrecognised shape`);
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
                throw Utils.makeErr(`Reconstructor.unify: failed to unify with constraint '${new Constraint(l, r).show()}'`);
            }
        }
        return topType;
    }

    reconstruct(program){
        this.rstFreshVar();
        // console.log(toASTTree(program));
        const empty = new EmptyJudgement(toASTTree(program));
        
        //console.log(empty.show());
        const full = this.typecheck(empty);
        //console.log(full.show());
        
        return full;

        const roughType = full.termType;
        const constrs = full.constrs;
        const unifiedTypes = constrs.toConstraintSets().map(cs => this.unify(roughType, cs));
        //console.log(unifiedTypes);
        unifiedTypes.map(t => Utils.downgradeTypes(t));
        return unifiedTypes;
    }
}