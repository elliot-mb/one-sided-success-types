import {Utils} from './utils.js';

export class Stack{
    static type = 'stack';

    constructor(xs = []){
        if(!Utils.isEmpty(xs)) xs.map(x => this.verifyElem(x)); 
        this.xs = xs;
        this.counter = xs.length;
        this.type = Stack.type;
    }

    //any checks that the subclasses want to do on their elements
    //this method can crash at runtime if something doesnt have the right type 
    verifyElem(x){
        //if(type === undefined) throw ...
        //if(type !== ...) throw ...

        //then we return x
        return x;
    }

    isEmpty(){
        return this.counter === 0;
    }

    pop(){
        if(!this.isEmpty()){
            this.counter--;
            //console.log(this.counter);
            return this.xs.pop();
        }
        throw `pop: ${this.type} is empty`;
    }

    add(x){
        this.verifyElem(x);
        this.xs.push(x);
        this.counter++;
    }

    //merge two constraint sets, must be a stack of the same thing 
    combine(otherStack){
        if(otherStack.type !== this.type) throw `combine: otherStack has a different type, '${otherStack.type} versus ${this.type}'`;
        while(!otherStack.isEmpty()){
            const currElem = otherStack.pop();
            this.verifyElem(currElem); //checks the type of whats inside
            this.add(currElem);
        }
    }

    // /**
    //  * 
    //  * @param A in place of this
    //  * @param B we put this
    //  */

    // this is a method specific to constraintSet 
    // swapWithAll(tA, tB){
    //     Utils.typeVarsOrCrash(tA, tB);
    //     this.cs.map(c => c.swapWith(tA, tB));
    // }

    show(){
        const showableElems = Utils.isEmpty(xs) ? false : xs[0].show !== undefined; // if the latter clause is true then theyre not undefined
        const looseCommaLength = 2;
        return `{${`${this.xs.map(x => showableElems ? x.show() : `${x}`).reduce((acc, str) => `${acc}, ${str}`, '')}`.substring(looseCommaLength)}}`;
    }

}