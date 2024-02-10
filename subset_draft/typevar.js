import {Utils} from './utils.js';

/**
 * its here we use the grammar for types, which
 * says that type variables are:
 * 
 * A, B ::= Num | A x B | A -> B | A^c | Ok 
 * 
 */

export class GenT{
    static type = 'typevar';
    static genShape = 'A';
    static okShape = 'Ok';
    static numShape = 'Num';
    static arrowShape = 'A -> B';
    
    constructor(id){
        this.id = id;
        this.shape = () => GenT.genShape;
    }

    getId(){
        return this.id;
    }

    show(){
        return this.getId();
    }

    freeIn(){
        return [this.getId()];
    }

    typeof() {
        return GenT.type;
    }

    /**
     * 
     * @param {the type variable we ought to replace} tA 
     * @param {the type variable we want to replace the searched-for one with} C 
     * @returns {a new type variable based swapping out the old for the new}
     */
    swapWith(tA, tB){ 
        Utils.typeVarsOrCrash(tA, tB);
        //console.log(`(${this.show()})[${tA.show()}/${tB.show()}] ${this.getId() === tA.getId()}`);
        if(this.getId() === tA.getId()) return tB;
        else return this;
    }

    rename(oldName, newName){ //rename maintains the shape, so does not return a new object but mutates state instead
        if(this.getId() === oldName) this.id = newName;
    }

    //recursively goes down the types to match up identifiers/base types
    equals(C) {
        if(this.shape() !== C.shape()) return false;
        if(this.shape() === GenT.numShape) return true;
        if(this.shape() === GenT.genShape){
            return this.getId() === C.getId();
        }
        if(this.shape() === GenT.arrowShape){
            return this.getA().equals(C.getA()) && this.getB().equals(C.getB());
        }
        return false;
    }       
}

// meaning: all values 
export class OkT extends GenT{

    constructor(){
        super(GenT.okShape);
        this.shape = () => GenT.okShape;
    }

    freeIn(){
        return []; //nothing free in Ok
    }

    //you cant subtitute with an Ok!
    swapWith(tA, tB){ 
        Utils.typeVarsOrCrash(tA, tB);
        return this;
    }

}

export class NumT extends GenT{

    constructor(){
        super(GenT.numShape);
        this.shape = () => GenT.numShape;
    }

    freeIn(){
        return []; //nothing free in Num
    }

    //you cant subtitute with a number!
    swapWith(tA, tB){ 
        Utils.typeVarsOrCrash(tA, tB);
        return this;
    }

    rename(oldName, newName){} //overload basecase in GenT to avoid errors
}

// export class CrossT extends TypeVar{
//     static shape = () => 'A x B';
// }

export class ArrowT extends GenT{

    constructor(A, B, id){
        super(id);
        Utils.typeVarsOrCrash(A, B);
        this.A = A;
        this.B = B;
        this.shape = () => GenT.arrowShape;
    }

    getA(){
        return this.A;
    }

    getB(){
        return this.B
    }

    setA(newA){
        Utils.typeVarOrCrash(newA);
        this.A = newA;
    }

    setB(newB){
        Utils.typeVarOrCrash(newB);
        this.B = newB;
    }

    show(){
        if(this.A.shape() === GenT.genShape || this.A.shape() === GenT.numShape) {
            return `${this.A.show()} -> ${this.B.show()}`;
        }
        return `(${this.A.show()}) -> ${this.B.show()}`; //latter brackets are never needed?
    }

    swapWith(tA, tB){ 
        ////console.log(`(${this.show()})[${tA.show()}/${tB.show()}]`);
        Utils.typeVarsOrCrash(tA, tB);
        // there are exactly no cases where we can replace a Nat/Num with a function type or anything else
        // pair is the only other disjoint type in the paper 
        // technically a type variable is not disjoint to a Num, but we never 
        // have any rules where 
        this.A = this.A.swapWith(tA, tB);
        this.B = this.B.swapWith(tA, tB); 
        return this;
    }

    rename(oldName, newName){
        this.A.rename(oldName, newName);
        this.B.rename(oldName, newName);
    }

    /**
     * all the types mentioned in this type 
     */
    freeIn(){
        const uniques = new Set([...this.A.freeIn(), ...this.B.freeIn()]).keys();
        let now = uniques.next().value;
        const result = [];
        while(now !== undefined){
            result.push(now);
            now = uniques.next().value;
        }
        return result; //just returns the unique identifiers
    }
}