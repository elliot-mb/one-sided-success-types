
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

    size(){
        return this.xs.length;
    }

    //no need to override ever
    /**
     * 
     * @param {*} joiner what character to join 
     * @returns 
     */
    showDelegate(joiner = ', '){
        const showableElems = Utils.isEmpty(this.xs) ? false : this.xs[0].show !== undefined; // if the latter clause is true then theyre not undefined
        const accLength = joiner.length;
        return `${`${this.xs.map(x => showableElems ? x.show() : `${x}`).reduce((acc, str) => `${acc}${joiner}${str}`, '')}`.substring(accLength)}`;
    }

    //can be overriden
    show(){
        return this.showDelegate();
    }

}