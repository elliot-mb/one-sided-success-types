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
        console.log(empty.show());
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
        const exps = toASTTrees(program, false, true);
        let idents = {}; 
        for(let i = 0; i < exps.length; i++){
            const exp = exps[i];
            if(termShape(exp) === 'const x = M; E'){
                idents[`${i}`] = (getSubterm(getSubterm(exp, 'x'), 'x')); //take out the identifier and then its name
            }
        }
        //console.log(exps); // <<
        // all expressions in here are toplevel declrs, shape "const x = M;" (NB there is no E)
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

            let isArr = termShape(exp) === Rule.compo && termShape(getSubterm(exp, 'M')) === Rule.abs;
            const typeIfArr = new ArrowT(new GenT(this.getFreshVar('T')), new GenT(this.getFreshVar('T'))); //a type insterted into assums to reference the assignment 
            if(isArr){
                assAccumulator.add(idents[`${i}`], typeIfArr);
            }

            const thisTermsAssms = assAccumulator.deepCopy();
            const empty = new EmptyJudgement(exp, thisTermsAssms);
            const full = this.typecheck(empty.asSubterm('M')); 
            
            if(isArr)
                full.conjoinOrer([new Orer(new Ander(new Constraint(full.termType, typeIfArr)))]); //constrain the free arrow type to being equal to the conclusion
            //type after the type reconstruction is done 

            full.conjoinOrer(constrAccumulator); //wrapped in a unit orer, attach previous line's constraints 
            constrAccumulator.push(full.constrs);
            console.log('_____________________________');
            fulls.push(full);
            //add the conclusion type to the accumulator after if we didnt add it as an arrow before
            //and dont reassign arrow 
            if(!isArr && idents[`${i}`] !== undefined){
                assAccumulator.add(idents[`${i}`], full.termType);
            }
        }
        //transfer identifier : type 
        
        //console.log(empty.show());
       
        //console.log(full.show());
        //const F = new GenT(this.getFreshVar('F'));
        //full.addToLast(new Constraint(full.termType, F));
        return fulls;

        const roughType = full.termType;
        const constrs = full.constrs;
        const unifiedTypes = constrs.toConstraintSets().map(cs => this.unify(roughType, cs));
        //console.log(unifiedTypes);
        unifiedTypes.map(t => Utils.downgradeTypes(t));
        return unifiedTypes;
    }
}