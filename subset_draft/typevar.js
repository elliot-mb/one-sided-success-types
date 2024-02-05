

/**
 * its here we use the grammar for types, which
 * says that type variables are:
 * 
 * A, B ::= Num | A x B | A -> B | A^c | Ok 
 * 
 */

export class GenT{
    static genShape = 'A';
    static numShape = 'Num';
    static arrowShape = 'A -> B';

    static areTypeVars = (A, B) => {
        if(A.typeof() !== 'typevar') throw 'Constraint(): A must be a \'typevar\'';
        if(B.typeof() !== 'typevar') throw 'Constraint(): B must be a \'typevar\'';
    }
    static isTypeVar = (A) => {
        if(A.typeof() !== 'typevar') throw 'Constraint(): A must be a \'typevar\'';
    }

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
        return 'typevar';
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

export class NumT extends GenT{

    constructor(id){
        super(id);
        this.shape = () => GenT.numShape;
    }

    show(){
        return this.shape();
    }
}

// export class CrossT extends TypeVar{
//     static shape = () => 'A x B';
// }

export class ArrowT extends GenT{

    constructor(A, B, id){
        super(id);
        GenT.areTypeVars(A, B);
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
        GenT.isTypeVar(newA);
        this.A = newA;
    }

    setB(newB){
        GenT.isTypeVar(newB);
        this.B = newB;
    }

    show(){
        return `(${this.A.show()}) -> (${this.B.show()})`; //latter brackets are never needed?
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