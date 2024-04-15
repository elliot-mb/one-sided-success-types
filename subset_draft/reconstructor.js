import {Utils} from './utils.js';
import {toASTTrees, getSubterm, termShape} from './wrapper_acorn.js';
import {Constraint} from './constraint.js';
import {ConstraintSet} from './constraint_set.js';
import {EmptyJudgement, Judgement} from './judgement.js';
import {Rule} from './rule.js';
import {Untypable} from './typevar.js';
import {Orer} from './orer.js';
import {GenT, ArrowT} from './typevar.js';
import {Assms} from './assms.js';
import {Ander} from './ander.js';

export class Reconstructor{
    static type = 'reconstructor';

    constructor(){ //making a new one just resets the variable names (but there are an infinite number anyway)
        this.lastUsedVar = String.fromCharCode(Utils.firstCharCode);
        this.type = Reconstructor.type;
    } 

    rstFreshVar(){
        this.lastUsedVar = String.fromCharCode(Utils.firstCharCode);
    }

    getFreshVar(pfix) {
        this.lastUsedVar = Utils.nextFreeTypeName(this.lastUsedVar);
        return `${pfix}${this.lastUsedVar}`;
    }

    peekNextVar(pfix) {
        return `${pfix}${Utils.nextFreeTypeName(this.lastUsedVar)}`;
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
            // 
            // 
            // 
            if(c.isLhsEqRhs()){}
            else if(c.isLhsNotInFreeRhs()){
                // 
                topType = topType.swapWith(c.lhs(), c.rhs());
                cSet.swapWithAll(c.lhs(), c.rhs());
            }
            else if(c.isRhsNotInFreeLhs()){
                // 
                topType = topType.swapWith(c.rhs(), c.lhs());
                cSet.swapWithAll(c.rhs(), c.lhs());
            }
            else if(c.areRhsLhsArrows()){
                // 
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
        const exps = toASTTrees(program, false, true);
        let idents = {}; 
        for(let i = 0; i < exps.length; i++){
            const exp = exps[i];
            const shape = termShape(exp);
            if(shape === Rule.compoAbs){ // just compoAbs needs access to its variable name in the defn
                idents[`${i}`] = (getSubterm(getSubterm(exp, 'f'), 'x')); //take out the identifier and then its name
            }
            if(shape === Rule.compo){ //compo needs its definition type added after typing, though 
                idents[`${i}`] = (getSubterm(getSubterm(exp, 'x'), 'x'));
            }
        }
        // all expressions in here are toplevel declrs, shape "const x = M;" where M can be x => N or otherwise (NB there is no E)
        // or they are ExperssionStatements of shape "M".
        // 
        // this means means the type is solely dictated by M in both cases,
        // so we unpack it below with empty.asSubterm('M')

        //what we build up as we process each line
        const assAccumulator = new Assms();
        const constrAccumulator = []; //array of orers for term con
        const fulls = [];
        for(let i = 0; i < exps.length; i++){
            const exp = exps[i];

            let isAbsDefn = termShape(exp) === Rule.compoAbs; //add a type for recursion when we confirm its an arrow function defn
            const typeIfArr = new ArrowT(new GenT(this.getFreshVar('T')), new GenT(this.getFreshVar('T'))); //a type insterted into assums to reference the assignment 
            if(isAbsDefn){
                assAccumulator.add(idents[`${i}`], typeIfArr);
            }

            const thisTermsAssms = assAccumulator.deepCopy();
            const empty = new EmptyJudgement(exp, thisTermsAssms);
                
            const full = this.typecheck(empty.asSubterm('M')); 
            
            if(isAbsDefn)
                full.conjoinOrer([new Orer(new Ander(new Constraint(full.termType, typeIfArr)))]); //constrain the free arrow type to being equal to the conclusion
            //type after the type reconstruction is done 

            full.conjoinOrer(constrAccumulator); //wrapped in a unit orer, attach previous line's constraints 
            constrAccumulator.push(full.constrs);
             
            fulls.push(full);
            //add the conclusion type to the accumulator after if we didnt add it as an arrow before
            //and dont reassign arrow 
            if(!isAbsDefn && idents[`${i}`] !== undefined){
                assAccumulator.add(idents[`${i}`], full.termType); //full.termType is mentioned in the constraints & assumptions, so we can use this in solving them! 
            }
        }
        //transfer identifier : type 
        
         
       
         
        //const F = new GenT(this.getFreshVar('F'));
        //full.addToLast(new Constraint(full.termType, F));
        return fulls;

        const roughType = full.termType;
        const constrs = full.constrs;
        const unifiedTypes = constrs.toConstraintSets().map(cs => this.unify(roughType, cs));
         
        unifiedTypes.map(t => Utils.downgradeTypes(t));
        return unifiedTypes;
    }
}