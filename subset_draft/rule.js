import {Constraint} from './constraint.js';
import {GenT, NumT, ArrowT, OkT} from './typevar.js';
import {Ander} from './ander.js';
import {Orer} from './orer.js';
import {Judgement, EmptyJudgement} from './judgement.js';


export class Rule {

    //static class for all the rules, each with its own shape 
    //all rules take a reference to the reconstructor (r), EmptyJudgement, and return a Judgement

    static cTVar = (r, empty) => {
        const typeInAssms = empty.variableType(empty.getSubterm('x'));
        const conclusn = empty.constrain(typeInAssms); //(CTVar)

        // //(OK)
        // conclusn.addAnder();
        // conclusn.addToLast(new Constraint(conclusn.termType, new OkT()));

        return conclusn;
    }

    static cTNum = (r, empty) => {
        return empty.constrain(new NumT()); 
    }

    static cTNumOp = (r, empty) => { //CTNumOp

        const premise1 = r.typecheck(empty.asSubterm('M'));
        const premise2 = r.typecheck(empty.asSubterm('N'));
        const conclusn = empty.constrain(new GenT(r.getFreshVar('X')));

        conclusn.addToLast(premise1.constrs);
        conclusn.addToLast(premise2.constrs);
        conclusn.addToLast(new Constraint(premise1.termType, new NumT()));
        conclusn.addToLast(new Constraint(premise2.termType, new NumT()));
        conclusn.addToLast(new Constraint(conclusn.termType, new NumT()));

        // //(OK)
        // conclusn.addAnder();
        // conclusn.addToLast(new Constraint(conclusn.termType, new OkT())); 

        return conclusn; //when we add to the constraints we must do this and then return 
    }

    static cTAbsInf = (r, empty) => { //CTAbsInf
        const X = new GenT(r.getFreshVar('X'));
        const body = empty.asSubterm('M');
        body.addAssm(empty.asSubterm('x').getSubterm('x'), X);
        const premise1 = r.typecheck(body);

        const conclusn = empty.constrain(new ArrowT(X, premise1.termType), premise1.constrs);

        //  //(OK)
        //  conclusn.addAnder();
        //  conclusn.addToLast(new Constraint(conclusn.termType, new OkT())); 

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

        //(OK)
        // conclusn.addAnder();
        // conclusn.addToLast(new Constraint(conclusn.termType, new OkT())); 

        return conclusn;
    }

    static cTIfLeZ = (r, empty) => { //IfLez
        const X = new GenT(r.getFreshVar('X'));
        const premise1 = r.typecheck(empty.asSubterm('M'));
        const premise2 = r.typecheck(empty.asSubterm('N'));
        const premise3 = r.typecheck(empty.asSubterm('P'));
        const conclusn = empty.constrain(X);

        conclusn.addToLast(premise1.constrs);
        conclusn.addToLast(premise2.constrs);
        conclusn.addToLast(premise3.constrs);
        conclusn.addToLast(new Constraint(premise1.termType, new NumT()));
        conclusn.addToLast(new Constraint(premise2.termType, X));
        conclusn.addToLast(new Constraint(premise3.termType, X));

        //(OK)
        // conclusn.addAnder();
        // conclusn.addToLast(new Constraint(conclusn.termType, new OkT())); 
        
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