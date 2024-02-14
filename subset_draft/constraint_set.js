import {Constraint} from './constraint.js';
import {GenT} from './typevar.js';
import {Utils} from './utils.js';
import {Stack} from './stack.js';

export class ConstraintSet extends Stack{ //this is a stack because of how we use it in unification 
    static type = 'constraintset';

    constructor(constraints = []){
        super(constraints);
        this.type = ConstraintSet.type;
    }

    verifyElem(x){
        Constraint.constraintOrCrash(x);

        return x;
    }
    /**
     * 
     * @param A in place of this
     * @param B we put this
     */
    swapWithAll(tA, tB){
        Utils.typeVarsOrCrash(tA, tB);
        this.xs.map(x => x.swapWith(tA, tB));
    }

}

