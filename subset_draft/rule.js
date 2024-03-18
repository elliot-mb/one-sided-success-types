import {Constraint} from './constraint.js';
import {GenT, NumT, ArrowT, OkT, CompT} from './typevar.js';
import {Ander} from './ander.js';
import {Orer} from './orer.js';
import {Judgement, EmptyJudgement} from './judgement.js';

//perhaps make one if you think it would help organisation 
class InnerRule {
    constructor(conclusn, X, assms){

    }
    
}

export class Rule {

    static disjunctiveRules = false;

    //static class for all the rules, each with its own shape 
    //all rules take a reference to the reconstructor (r), EmptyJudgement, and return a Judgement

    /////////////////////////////////////////////////
    ////                                         ////
    ////                INNER RULES              ////
    //// those rules which just add their        ////
    //// constraints. they all return orers      ////
    /////////////////////////////////////////////////

    static addOk = (X) => { //structural
        return new Orer(new Ander(new Constraint(X, new OkT())));
    }

    static addOkC1 = (assms) => { //structural 
        const allVarTypes = assms.allTypings();
        const okCVarTypes = allVarTypes.map(x => new Constraint(x.lhs(), new CompT(new OkT())));
        return new Orer(okCVarTypes.map(x => new Ander(x)));
    }

    //disjointness 
    static addDisj = (A, B) => {
        const D = new GenT('D');
        const E = new GenT('E');
        const DtoE = new ArrowT(D, E);
        return new Orer(
            new Ander(new Constraint(A, new NumT), new Constraint(B, DtoE)),
            new Ander(new Constraint(A, DtoE), new Constraint(B, new NumT)),
            new Ander(new Constraint(A, new CompT(B))),
            new Ander(new Constraint(new CompT(A), B))
        );
    }

    // Disj is spread among the other rules

    static addApp2 = (X, T1, C1) => {
        return new Orer(
            new Ander(
                new Constraint(T1, new CompT(new ArrowT(new CompT(new OkT()), X))),
                new Orer(C1, new Ander(addDisj()))
            )
        );
    }

    static addApp3 = (T2, C2) => {

    }

    static addIfZ2 = (X, T1, T2, C1, C2) => {

    }

    static addNumOp2 = (T1, T2, C1, C2) => {

    }

    static addNumOp3 = (X, T1, T2, C1, C2) => {

    }

    /////////////////////////////////////////////////
    ////                                         ////
    ////                SHAPE RULES              ////
    //// those rules that apply directly to the  ////
    //// grammar                                 ////       
    /////////////////////////////////////////////////

    static cTVar = (r, empty) => {
        const X = new GenT(r.getFreshVar('X'));
        const typeInAssms = empty.variableType(empty.getSubterm('x'));
        const conclusn = empty.constrain(X); //(CTVar)

        conclusn.addToLast(new Constraint(X, typeInAssms)); // X = Gamma(x)

        if(Rule.disjunctiveRules){
            conclusn.addAnder();
            conclusn.addToLast(Rule.addOk(X));
        }

        return conclusn;
    }

    static cTNum = (r, empty) => {
        const X = new GenT(r.getFreshVar('X'));
        const conclusn = empty.constrain(X); 

        conclusn.addToLast(new Constraint(X, new NumT()));
        
        if(Rule.disjunctiveRules){
            conclusn.addAnder();
            conclusn.addToLast(Rule.addOk(X));
        }
        

        return conclusn;
    }

    static cTNumOp = (r, empty) => { //CTNumOp
        const X = new GenT(r.getFreshVar('X'));
        const premise1 = r.typecheck(empty.asSubterm('M'));
        const premise2 = r.typecheck(empty.asSubterm('N'));
        const conclusn = empty.constrain(X);

        conclusn.addToLast(premise1.constrs);
        conclusn.addToLast(premise2.constrs);
        conclusn.addToLast(new Constraint(premise1.termType, new NumT()));
        conclusn.addToLast(new Constraint(premise2.termType, new NumT()));
        conclusn.addToLast(new Constraint(conclusn.termType, new NumT()));

        if(Rule.disjunctiveRules){
            conclusn.addAnder();
            conclusn.addToLast(Rule.addOk(X));
        }
  

        return conclusn; //when we add to the constraints we must do this and then return 
    }

    static cTAbsInf = (r, empty) => { //CTAbsInf
        const X = new GenT(r.getFreshVar('X'));
        const Y = new GenT(r.getFreshVar('Y'));
        const body = empty.asSubterm('M');
        body.addAssm(empty.asSubterm('x').getSubterm('x'), Y);
        const premise1 = r.typecheck(body);

        const conclusn = empty.constrain(X);

        conclusn.addToLast(premise1.constrs); //make sure to add the premise constraints (where )
        conclusn.addToLast(new Constraint(X, new ArrowT(Y, premise1.termType)));
         
        if(Rule.disjunctiveRules){
            conclusn.addAnder();
            conclusn.addToLast(Rule.addOk(X));
        }
        

        return conclusn;
    }

    static cTApp = (r, empty) => { //CTApp
        const X = new GenT(r.getFreshVar('X'));
        const premise1 = r.typecheck(empty.asSubterm('M'));
        const premise2 = r.typecheck(empty.asSubterm('N'));
        const conclusn = empty.constrain(X);

        conclusn.addToLast(premise1.constrs);
        conclusn.addToLast(premise2.constrs);
        conclusn.addToLast(new Constraint(premise1.termType, new ArrowT(premise2.termType, X)));

        if(Rule.disjunctiveRules){
            conclusn.addAnder();
            conclusn.addToLast(Rule.addOk(X));
        }

        return conclusn;
    }

    static cTIfLeZ = (r, empty) => { //IfLez
        const X = new GenT(r.getFreshVar('X'));
        const premise1 = r.typecheck(empty.asSubterm('M'));
        const premise2 = r.typecheck(empty.asSubterm('N'));
        const premise3 = r.typecheck(empty.asSubterm('P'));
        const conclusn = empty.constrain(X);

        conclusn.addToLast(premise1.constrs); //this will be handled in a complement rule 
        conclusn.addToLast(premise2.constrs);
        conclusn.addToLast(premise3.constrs);
        conclusn.addToLast(new Constraint(premise1.termType, new NumT())); //this is handled in a complement rule 
        conclusn.addToLast(new Constraint(premise2.termType, X));
        conclusn.addToLast(new Constraint(premise3.termType, X));

        if(Rule.disjunctiveRules){
            conclusn.addAnder();
            conclusn.addToLast(Rule.addOk(X));
        }
        
        return conclusn;
    }

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
        ruleFor[Rule.iflz]= Rule.cTIfLeZ;
        return ruleFor;
    })();
}