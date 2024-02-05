import {Constraint} from './constraint.js';
import {GenT} from './typevar.js';

export class ConstraintSet{

    constructor(constraints){
        constraints.map(cMaybe => Constraint.constraintOrCrash(cMaybe));
        if(constraints.length === 0) throw 'ConstraintSet(): must be given more than zero constraints';
        this.cs = constraints;
        this.counter = constraints.length;
    }

    isEmpty(){
        return this.counter === 0;
    }

    pop(){
        if(!this.isEmpty()){
            this.counter--;
        }
        return this.cs[this.counter];
    }

    add(C){
        Constraint.constraintOrCrash(C);
        this.cs.push(C);
        this.counter++;
    }

    /**
     * 
     * @param A in place of  
     * @param B we put 
     */
    swapWithAll(A, B){
        GenT.typeVarsOrCrash(A, B);
        this.cs.map(c => new Constraint( //swap both sides of all constraints
            c.lhs().swapWith(A, B),
            c.rhs().swapWith(A, B)) 
        );
    }

}