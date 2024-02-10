import {Constraint} from './constraint.js';
import {GenT} from './typevar.js';
import {Utils} from './utils.js';

export class ConstraintSet{
    static type = 'constraintset';

    constructor(constraints = []){
        if(constraints.length !== 0) constraints.map(cMaybe => Constraint.constraintOrCrash(cMaybe));
        this.cs = constraints;
        this.counter = constraints.length;
        this.type = ConstraintSet.type;
    }

    isEmpty(){
        return this.counter === 0;
    }

    pop(){
        if(!this.isEmpty()){
            this.counter--;
            return this.cs.pop();
        }
        throw `pop: constraint set is empty`;
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
    swapWithAll(tA, tB){
        Utils.typeVarsOrCrash(tA, tB);
        this.cs.map(c => c.swapWith(tA, tB));
    }

    show(){
        return `{${`${this.cs.map(c => c.show()).reduce((acc, str) => `${acc}, ${str}`, '')}`.substring(2)}}`;
    }

}