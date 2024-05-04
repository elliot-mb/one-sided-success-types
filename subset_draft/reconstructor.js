import {Utils} from './utils.js';
import {toASTTrees, getSubterm, termShape, getAllVariablesInDefn} from './wrapper_acorn.js';
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
    static SYNTACTIC_DEFN_EXCLUSION = false; // it only partly fixed the issue of false positives in program lines, so keep false 
    static SHOUTY = true;

    constructor(){ //making a new one just resets the variable names (but there are an infinite number anyway)
        this.lastUsedVar = String.fromCharCode(Utils.firstCharCode);
        this.depth = 0; //tree indentation test
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

    makeTabbing(){
        let tabs = ``;
        for(let i = 0; i < this.depth; i++) tabs += (`\t`);
        return tabs;
    }

    /**
     * regular non-success type checker
     * @param {*} EmptyJudgement Γ ⊢ M 
     * @returns {*} Judgement object 
     */
    typecheck(empty){
         
        const maybeRule = Rule.appliesTo[empty.shape];
        if(maybeRule !== undefined){
            if(Reconstructor.SHOUTY) console.log(`${this.makeTabbing()}${maybeRule.name}`);
            this.depth++;
            const full = maybeRule(this, empty);
            if(Reconstructor.SHOUTY) console.log(`${this.makeTabbing()}${full.constrs.show()}`);
            this.depth--;
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
        if(exps.length === 0) { 
            return null;
        }
        let idents = {}; 
        let evalTally = 0;
        let evalIdents = {};
        for(let i = 0; i < exps.length; i++){
            const exp = exps[i];
            const shape = termShape(exp);
            if(shape === Rule.compoAbs){ // just compoAbs needs access to its variable name in the defn
                idents[`${i}`] = (getSubterm(getSubterm(exp, 'f'), 'x')); //take out the identifier and then its name
            }else if(shape === Rule.compo){ //compo needs its definition type added after typing, though 
                idents[`${i}`] = (getSubterm(getSubterm(exp, 'x'), 'x'));
            }else{ //ignored evaluations 
                evalIdents[`${i}`] = `eval#${evalTally}`; //fake unique identifier in place of the actual term
                evalTally++;
            }
        
        }
        // all expressions in here are toplevel declrs, shape "const x = M;" where M can be x => N or otherwise (NB there is no E)
        // or they are ExperssionStatements of shape "M".
        // 
        // this means means the type is solely dictated by M in both cases,
        // so we unpack it below with empty.asSubterm('M')

        //what we build up as we process each line
        const assAccumulator = new Assms();
        const assEvalAccumulator = new Assms();
        const constrAccumulator = []; //array of orers for term con
        let finalFull = null;
        for(let i = 0; i < exps.length; i++){
            const exp = exps[i];
            const isEval = evalIdents[`${i}`] !== undefined;
            const isAbs = termShape(exp) === Rule.compoAbs;
            let conclusionTy;
            const conclusionTyName = `T`;

            const tyNameA = this.getFreshVar(conclusionTyName);
            const tyNameB = this.getFreshVar(conclusionTyName);
            conclusionTy = termShape(exp) === Rule.compoAbs 
                ? new ArrowT(new GenT(tyNameA), new GenT(tyNameB), GenT.ArrowT, true)
                : new GenT(this.getFreshVar(conclusionTyName), true); //a type insterted into assums to reference the assignment 
            
            if(isAbs) assAccumulator.add(idents[`${i}`], conclusionTy);

            const thisTermsAssms = assAccumulator.deepCopy();

            //since steven mentioned that this doenst stop certain annoying false positives, we will make this 
            //FALSE all the time! 
            if(Reconstructor.SYNTACTIC_DEFN_EXCLUSION)thisTermsAssms.intersectionDom(getAllVariablesInDefn(exp));

            const empty = new EmptyJudgement(exp, thisTermsAssms);
            
            const full = this.typecheck(empty.asSubterm('M')); 
            
            //the type we generated for this is equal to the resultant type 
            full.conjoinOrer([new Orer(new Ander(new Constraint(full.termType, conclusionTy)))]); 
            if(!isEval && !isAbs) assAccumulator.add(idents[`${i}`], conclusionTy);
            if(isEval) assEvalAccumulator.add(evalIdents[`${i}`], conclusionTy); //combine these at the end to scrutinise all the types in the program
            
            if(Reconstructor.SHOUTY) console.log(full.constrs.show());

            const justThisFullConstrCopy = new Orer(); 
            full.constrs.xs.map(ander => justThisFullConstrCopy.add(ander));
            full.conjoinOrer(constrAccumulator); //wrapped in a unit orer, attach previous line's constraints 
            constrAccumulator.push(justThisFullConstrCopy); //put all the constraints from this full judgement into the accumualtor
             
            finalFull = full;
            // //add the conclusion type to the accumulator after if we didnt add it as an arrow before
            // //and dont reassign arrow 
            // if(!isAbsDefn && idents[`${i}`] !== undefined){
            //     assAccumulator.add(idents[`${i}`], full.termType); //full.termType is mentioned in the constraints & assumptions, so we can use this in solving them! 
            // }
        }
        //////console.log(assEvalAccumulator.show());
        assAccumulator.addAll(assEvalAccumulator);
        //////console.log(constrAccumulator.map(x => `@@${x.show()}`));
        if(Reconstructor.SHOUTY) console.log(finalFull.constrs.show());
         
        //const F = new GenT(this.getFreshVar('F'));
        //full.addToLast(new Constraint(full.termType, F));
        //console.log(finalFull.show());
        
        return {
            'judgement': finalFull,
            'delta_assms': assAccumulator //represents how we type programs as type environments 
        };

        const roughType = full.termType;
        const constrs = full.constrs;
        const unifiedTypes = constrs.toConstraintSets().map(cs => this.unify(roughType, cs));
         
        unifiedTypes.map(t => Utils.downgradeTypes(t));
        return unifiedTypes;
    }
}