

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
    static numShape = 'Num';
    static arrowShape = 'A -> B';

    static typeVarsOrCrash = (A, B) => {
        if(A.typeof() !== GenT.type) throw 'typeVarsOrCrash(): A must be a \'typevar\'';
        if(B.typeof() !== GenT.type) throw 'typeVarsOrCrash(): B must be a \'typevar\'';
    }
    static typeVarOrCrash = (A) => {
        console.log(A);
        if(A.typeof() !== GenT.type) throw 'typeVarOrCrash(): A must be a \'typevar\'';
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
        return GenT.type;
    }

    /**
     * 
     * @param {the type variable we ought to replace} tA 
     * @param {the type variable we want to replace the searched-for one with} C 
     * @returns {a new type variable based swapping out the old for the new}
     */
    swapWith(tA, tB){ 
        GenT.typeVarsOrCrash(tA, tB);
        if(this.getId() === tA.getId()) return tB;
        else return this;
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

    swapWith(tA, tB){ 
        GenT.typeVarsOrCrash(tA, tB);
        if(tB.shape() !== GenT.numShape) throw `swapWith: ${GenT.numShape} type is not a ${tB.shape()} (disjoint types)`;
        return tB;
    }
}

// export class CrossT extends TypeVar{
//     static shape = () => 'A x B';
// }

export class ArrowT extends GenT{

    constructor(A, B, id){
        super(id);
        GenT.typeVarsOrCrash(A, B);
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
        GenT.typeVarOrCrash(newA);
        this.A = newA;
    }

    setB(newB){
        GenT.typeVarOrCrash(newB);
        this.B = newB;
    }

    show(){
        return `(${this.A.show()}) -> ${this.B.show()}`; //latter brackets are never needed?
    }

    swapWith(tA, tB){ 
        GenT.typeVarsOrCrash(tA, tB);
        if(this.getA().getId() === tA.getId()) {
            this.A = tB;
        }
        if(this.getB().getId() === tA.getId()){
            this.B = tB;
        }
        return new ArrowT(
            this.getA().swapWith(tA, tB),
            this.getB().swapWith(tA, tB),
            this.id
        ); //searches further down
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