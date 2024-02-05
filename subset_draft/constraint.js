import {TypeVar} from './typevar.js';

export class Constraint{
    static typeof = () => 'constraint';

    /**
     * 
     * @param {type variable A} A 
     * @param {type variable B} B 
     */

    constructor(A, B){
        TypeVar.areTypeVars(A, B);
        this.A = A;
        this.B = B; 
    }

    lhs(){
        return this.A;
    }

    rhs(){
        return this.B;
    }

    /**
     *  S = T
     *  S = X and X not in FV(T)
     */
    isLhsFreeInRhs(){
        const 
    }

    show(){
        return `${this.A.show()} = ${this.B.show()}`;
    }

}