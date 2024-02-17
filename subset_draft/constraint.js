import {GenT} from './typevar.js';
import {Utils} from './utils.js';

export class Constraint{
    static type = 'constraint';

    static constraintOrCrash = (C) => {
        if(C.type === undefined) throw 'constraintOrCrash: type does not exist on C; C is not a constraint';
        if(C.type !== Constraint.type) throw 'constraintOrCrash: C has not the type Constraint';
    }

    //checks that, when A is a single type variable, that it's identifier does not appear in FV(B)
    static fstNotInFreeSnd = (A, B) => {
        Utils.typeVarsOrCrash(A, B);
        const fv = A.freeIn(); //must be a single elem to not be a function
        const fvs = B.freeIn();
        if(fv.length > 1) return false; // this is either the second or third case in https://www3.nd.edu/~dchiang/teaching/pl/2019/typerec.html
        const v = fv[0];
        return !fvs.map(rV => v === rV).reduce((acc, b) => acc || b, false); 
    }

    /**
     * 
     * @param {type variable A} A 
     * @param {type variable B} B 
     */

    constructor(A, B){
        Utils.typeVarsOrCrash(A, B);
        this.A = A;
        this.B = B;
        this.type = Constraint.type; 
    }

    lhs(){
        return this.A;
    }

    rhs(){ 
        return this.B;
    }

    isLhsEqRhs(){ //in terms of labels and shapes
        return this.lhs().equals(this.rhs());
    }

    /**
     *  S = T
     *  S = X and X not in FV(T)
     */
    isLhsNotInFreeRhs(){
        return Constraint.fstNotInFreeSnd(this.A, this.B) && this.lhs().shape() == GenT.genShape;
    }

    isRhsNotInFreeLhs(){
        return Constraint.fstNotInFreeSnd(this.B, this.A) && this.rhs().shape() == GenT.genShape;
    }

    areRhsLhsArrows(){
        return this.A.shape() === GenT.arrowShape && this.B.shape() === GenT.arrowShape;
    }

    show(){
        return `${this.A.show()} = ${this.B.show()}`;
    }

    swapWith(tA, tB){
        Utils.typeVarsOrCrash(tA, tB);
        //console.log(`constraint swap start: ${this.A.show()} = ${this.B.show()}`);
        this.A = this.A.swapWith(tA, tB);
        this.B = this.B.swapWith(tA, tB);
        //console.log(`constraint swap end: ${this.A.show()} = ${this.B.show()}`);
        return this;
    }

    equals(constr){
        Constraint.constraintOrCrash(constr);
        return this.lhs().equals(constr.lhs()) && this.rhs().equals(constr.rhs());
    }

}