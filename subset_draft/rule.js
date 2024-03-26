import {Constraint} from './constraint.js';
import {GenT, NumT, ArrowT, OkT, CompT} from './typevar.js';
import {Ander} from './ander.js';
import {Orer} from './orer.js';
import {Judgement, EmptyJudgement} from './judgement.js';
import {Assms} from './assms.js';
import {Utils} from './utils.js';

//perhaps make one if you think it would help organisation 
class InnerRule {
    constructor(conclusn, X, assms){

    }
    
}

export class Rule {

    //consts 
    static okC = () => new CompT(new OkT());
    static disjunctiveRules = true;
    static disjTypeName = 'A';

    //static class for all the rules, each with its own shape 
    //all rules take a reference to the reconstructor (r), EmptyJudgement, and return a Judgement

    /////////////////////////////////////////////////
    ////                                         ////
    ////                INNER RULES              ////
    //// those rules which just add their        ////
    //// constraints. they all return orers      ////
    ////                                         ////
    /////////////////////////////////////////////////

    // static addFreeX = (X, r) => {
    //     return new Orer(new Constraint(X, r.getFreshVar('F'))); //F for free
    // }

    static addOk = (X) => { //structural
        return new Orer(new Ander(new Constraint(X, new OkT())));
    }

    //assms should come from the judgement on the way up (empty) because this is what
    //this means we cant run it where we run most other rules, because assumptions
    //come from rules above that we wouldnt be able to see otherwise when
    //executing the rule on the way up. This stops incorrectly showing things are
    //Ok^c, hopefully
    static addOkC1 = (assms) => { //structural 
        Utils.typeIsOrCrash(assms, Assms.type);
        const assmTypings = assms.getTypings();
        const okCVarTypes = Object.keys(assmTypings).map(x => new Constraint(assmTypings[x], Rule.okC()));
        return new Orer(...okCVarTypes.map(x => new Ander(x)));
    }

    //disjointness helper function (r is the reconstructor for fresh var tracking)
    static addDisj = (A, B, r) => {
        if(A.shape() === GenT.compShape){
            throw Utils.makeErr(`addDisj: Disj shouldnt have complemented types as inputs, A is ${A.show()}`);
        }
        if(B.shape() === GenT.compShape){
            throw Utils.makeErr(`addDisj: Disj shouldnt have complemented types as inputs, B is ${B.show()}`);
        }
        const Z = new GenT(r.getFreshVar('Z'));
        const W = new GenT(r.getFreshVar('W'));
        const ZToW = new ArrowT(Z, W);
        return new Orer(
            new Ander(new Constraint(A, new NumT), new Constraint(B, ZToW)),
            new Ander(new Constraint(A, ZToW), new Constraint(B, new NumT)),
            new Ander(new Constraint(A, new CompT(B))),
            new Ander(new Constraint(new CompT(A), B))
        );
    }

    //constraints like C1 are all orers
    static addApp2 = (X, T1, C1, r) => {
        return new Orer(
            new Ander(
                Rule.addDisj(T1, new ArrowT(Rule.okC(), X), r),
                C1
            )
        );
    }

    static addApp3 = (T2, C2) => {
        return new Orer(
            new Ander(
                new Constraint(T2, Rule.okC()),
                C2 //orer 
            )
        );
    }

    static addIfZ2 = (X, T2, T3, C2, C3) => {
        return new Orer(
            new Ander(
                new Constraint(T2, T3),
                new Constraint(T2, X),
                //new Constraint(T3, X), transitivity 
                C2,
                C3
            )
        );
    }

    static addNumOp2 = (T1, T2, C1, C2) => { // not expected to make a difference 
        return new Orer(
            new Ander(
                new Constraint(T1, Rule.okC()),
                C1
            ),
            new Ander(
                new Constraint(T2, Rule.okC()),
                C2
            )
        );
    }

    static addNumOp3 = (T1, T2, C1, C2, r) => {
        return new Orer(
            new Ander(
                Rule.addDisj(T1, new NumT(), r),
                C1
            ),
            new Ander(
                Rule.addDisj(T2, new NumT(), r),
                C2
            )
        );
    }



    /////////////////////////////////////////////////
    ////                                         ////
    ////                SHAPE RULES              ////
    //// those rules that apply directly to the  ////
    //// grammar                                 ////    
    ////                                         ////   
    /////////////////////////////////////////////////

    static cTVar = (r, empty) => {
        const OkC1Constrs = Rule.addOkC1(empty.getAssms());
        const X = new GenT(r.getFreshVar('X'));
        const typeInAssms = empty.variableType(empty.getSubterm('x'));
        const conclusn = empty.constrain(X); //(CTVar)

        conclusn.addToLast(new Constraint(X, typeInAssms)); // X = Gamma(x)

        if(Rule.disjunctiveRules){
            conclusn.addAnder();
            conclusn.addToLast(Rule.addOk(X));
            if(!OkC1Constrs.isEmpty()){
                conclusn.addAnder();
                conclusn.addToLast(OkC1Constrs);
            }

            //no other var rules 
        }

        return conclusn;
    }

    static cTNum = (r, empty) => {
        const OkC1Constrs = Rule.addOkC1(empty.getAssms());
        const X = new GenT(r.getFreshVar('X'));
        const conclusn = empty.constrain(X); 

        conclusn.addToLast(new Constraint(X, new NumT()));
        
        if(Rule.disjunctiveRules){
            conclusn.addAnder();
            conclusn.addToLast(Rule.addOk(X));
            if(!OkC1Constrs.isEmpty()){
                conclusn.addAnder();
                conclusn.addToLast(OkC1Constrs);
            }
            //no other num rules 
        }
        

        return conclusn;
    }

    static cTNumOp = (r, empty) => { //CTNumOp
        const OkC1Constrs = Rule.addOkC1(empty.getAssms());
        const X = new GenT(r.getFreshVar('X'));
        const premise1 = r.typecheck(empty.asSubterm('M'));
        const premise2 = r.typecheck(empty.asSubterm('N'));
        const T1 = premise1.termType;
        const T2 = premise2.termType;
        const C1 = premise1.constrs;
        const C2 = premise2.constrs;

        const conclusn = empty.constrain(X);

        // conclusn.addAssmsFromJudgement(premise1);
        // conclusn.addAssmsFromJudgement(premise2); 

        conclusn.addToLast(premise1.constrs);
        conclusn.addToLast(premise2.constrs);
        conclusn.addToLast(new Constraint(premise1.termType, new NumT()));
        conclusn.addToLast(new Constraint(premise2.termType, new NumT()));
        conclusn.addToLast(new Constraint(conclusn.termType, new NumT()));

        if(Rule.disjunctiveRules){
            conclusn.addAnder();
            conclusn.addToLast(Rule.addOk(X));
            if(!OkC1Constrs.isEmpty()){
                conclusn.addAnder();
                conclusn.addToLast(OkC1Constrs);
            }
            conclusn.addAnder();
            conclusn.addToLast(Rule.addNumOp2(T1, T2, C1, C2));
            conclusn.addAnder();
            conclusn.addToLast(Rule.addNumOp3(T1, T2, C1, C2, r));
        }
  

        return conclusn; //when we add to the constraints we must do this and then return 
    }

    static cTAbsInf = (r, empty) => { //CTAbsInf
        const OkC1Constrs = Rule.addOkC1(empty.getAssms());
        const X = new GenT(r.getFreshVar('X'));
        const Y = new GenT(r.getFreshVar('Y'));
        const body = empty.asSubterm('M');
        body.addAssm(empty.asSubterm('x').getSubterm('x'), Y);
        const premise1 = r.typecheck(body);

        const conclusn = empty.constrain(X);
        //copy the variables into our conclusion, even with just one premise
        //this must be done otherwise we wont transfer assumptions down, but do
        // we even need to?
        // conclusn.addAssmsFromJudgement(premise1);

        conclusn.addToLast(premise1.constrs); //make sure to add the premise constraints (where )
        conclusn.addToLast(new Constraint(X, new ArrowT(Y, premise1.termType)));
         
        if(Rule.disjunctiveRules){
            conclusn.addAnder();
            conclusn.addToLast(Rule.addOk(X));
            if(!OkC1Constrs.isEmpty()){ // we forbid this from running here because it will infer on types it didnt have access to 
                conclusn.addAnder();
                conclusn.addToLast(OkC1Constrs);
            }
            //no other abs rules 
        }
        

        return conclusn;
    }

    static cTApp = (r, empty) => { //CTApp
        const OkC1Constrs = Rule.addOkC1(empty.getAssms());
        const X = new GenT(r.getFreshVar('X'));
        const premise1 = r.typecheck(empty.asSubterm('M')); //asSubterm returns a copy 
        const premise2 = r.typecheck(empty.asSubterm('N'));
        const T1 = premise1.termType;
        const T2 = premise2.termType;
        const C1 = premise1.constrs;
        const C2 = premise2.constrs;
        
        const conclusn = empty.constrain(X);

        //copy the variables into our conclusion (after we run both)
        // conclusn.addAssmsFromJudgement(premise1);
        // conclusn.addAssmsFromJudgement(premise2); 

        conclusn.addToLast(premise1.constrs);
        conclusn.addToLast(premise2.constrs);
        conclusn.addToLast(new Constraint(premise1.termType, new ArrowT(premise2.termType, X)));

        if(Rule.disjunctiveRules){
            conclusn.addAnder();
            conclusn.addToLast(Rule.addOk(X));
            if(!OkC1Constrs.isEmpty()){
                conclusn.addAnder();
                conclusn.addToLast(OkC1Constrs);
            }
            conclusn.addAnder();
            conclusn.addToLast(Rule.addApp2(X, T1, C1, r)); 
            conclusn.addAnder();
            conclusn.addToLast(Rule.addApp3(T2, C2));
        }

        return conclusn;
    }

    static cTIfZ = (r, empty) => { //IfLez
        const OkC1Constrs = Rule.addOkC1(empty.getAssms());
        const X = new GenT(r.getFreshVar('X'));
        const premise1 = r.typecheck(empty.asSubterm('M'));
        const premise2 = r.typecheck(empty.asSubterm('N'));
        const premise3 = r.typecheck(empty.asSubterm('P'));
        const T1 = premise1.termType;
        const T2 = premise2.termType;
        const T3 = premise3.termType;
        const C1 = premise1.constrs;
        const C2 = premise2.constrs;
        const C3 = premise3.constrs;

        const conclusn = empty.constrain(X);

        // conclusn.addAssmsFromJudgement(premise1);
        // conclusn.addAssmsFromJudgement(premise2); 
        // conclusn.addAssmsFromJudgement(premise3);

        conclusn.addToLast(C1); //this will be handled in a complement rule 
        conclusn.addToLast(Rule.addDisj(T1, new NumT(), r)); //this is handled in a complement rule 

        if(Rule.disjunctiveRules){
            conclusn.addAnder();
            conclusn.addToLast(Rule.addOk(X));
            if(!OkC1Constrs.isEmpty()){
                conclusn.addAnder();
                conclusn.addToLast(OkC1Constrs);
            }
            conclusn.addAnder();
            conclusn.addToLast(Rule.addIfZ2(X, T2, T3, C2, C3));
        }
        
        return conclusn;
    }


    static expSmt = 'M';
    static var = 'x';
    static num = 'n';
    static op = 'M o N';
    static abs = 'x => M';
    static app = 'M(N)';
    static iflz = 'M <= 0 ? N : P';

    static appliesTo = (() => {
        const ruleFor = {};
        ruleFor[Rule.var] = Rule.cTVar;
        ruleFor[Rule.num] = Rule.cTNum;
        ruleFor[Rule.op]  = Rule.cTNumOp;
        ruleFor[Rule.abs] = Rule.cTAbsInf;
        ruleFor[Rule.app] = Rule.cTApp;
        ruleFor[Rule.iflz]= Rule.cTIfZ;
        return ruleFor;
    })();
}