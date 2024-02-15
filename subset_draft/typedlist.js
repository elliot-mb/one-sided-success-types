
import {Utils} from './utils.js';

//just an array with a type check
export class TypedList{
    static type = 'typedlist';

    constructor(xs = []){
        if(!Utils.isEmpty(xs)) xs.map(x => this.verifyElem(x)); 
        this.xs = xs;
        this.type = TypedList.type;
    }

    //any checks that the subclasses want to do on their elements
    //this method can crash at runtime if something doesnt have the right type 
    verifyElem(x){
        return x;
    }

    //no need to override ever
    showDelegate(){
        const showableElems = Utils.isEmpty(this.xs) ? false : this.xs[0].show !== undefined; // if the latter clause is true then theyre not undefined
        const looseCommaLength = 2;
        return `${`${this.xs.map(x => showableElems ? x.show() : `${x}`).reduce((acc, str) => `${acc}, ${str}`, '')}`.substring(looseCommaLength)}`;
    }

    //can be overriden
    show(){
        return showDelegate();
    }

}