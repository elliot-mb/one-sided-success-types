

/**
 * its here we use the grammar for types, which
 * says that type variables are:
 * 
 * A, B ::= Num | A x B | A -> B | A^c | Ok 
 * 
 */

export class TypeVar{
    
    static areTypeVars = (A, B) => {
        if(A.typeof() !== 'typevar') throw 'Constraint(): A must be a \'typevar\'';
        if(B.typeof() !== 'typevar') throw 'Constraint(): B must be a \'typevar\'';
    }
    static isTypeVar = (A) => {
        if(A.typeof() !== 'typevar') throw 'Constraint(): A must be a \'typevar\'';
    }

    constructor(id){
        this.id = id;
    }

    getId(){
        return this.id;
    }

    freeIn(){
        return [this.getId()];
    }

    typeof() {
        return 'typevar';
    }
}

export class NumT extends TypeVar{
    static shape = () => 'Num';

    constructor(id){
        super(id);
    }

    show(){
        return NumT.shape();
    }
}

// export class CrossT extends TypeVar{
//     static shape = () => 'A x B';
// }

export class ArrowT extends TypeVar{
    static shape = () => 'A -> B';

    constructor(A, B, id){
        super(id);
        TypeVar.areTypeVars(A, B);
        this.A = A;
        this.B = B;
    }

    getA(){
        return this.A;
    }

    getB(){
        return this.B
    }

    setA(newA){
        TypeVar.isTypeVar(newA);
        this.A = newA;
    }

    setB(newB){
        TypeVar.isTypeVar(newB);
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