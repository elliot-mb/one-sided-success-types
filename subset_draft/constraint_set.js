import {Constraint} from './constraint.js';
import {GenT} from './typevar.js';

export class ConstraintSet{

    constructor(constraints = []){
        if(constraints.length !== 0) constraints.map(cMaybe => Constraint.constraintOrCrash(cMaybe));
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

    //merge two constraint sets
    combine(CS){
        while(!CS.isEmpty()){
            this.add(CS.pop());
        }
    }

    /**
     * 
     * @param A in place of this
     * @param B we put this
     */
    swapWithAll(A, B){
        GenT.typeVarsOrCrash(A, B);
        this.cs.map(c => new Constraint( //swap both sides of all constraints
            c.lhs().swapWith(A, B),
            c.rhs().swapWith(A, B)) 
        );
    }

    show(){
        return `${this.cs.map(c => c.show()).reduce((acc, str) => `${acc}, ${str}`, '')}`;
    }

}