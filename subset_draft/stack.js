import {Utils} from './utils.js';
import {TypedList} from './typedlist.js';

export class Stack extends TypedList{
    static type = 'stack';

    constructor(xs = []){
        super(xs);
        this.counter = xs.length;
        this.type = Stack.type;
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

}