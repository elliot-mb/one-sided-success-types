import {AndList} from './andlist.js';
import {Utils} from './utils.js';
import {TypedList} from './typedlist.js';

export class OrList extends TypedList{
    static type = 'orlist';

    constructor(...ands){
        super(ands);
        this.type = OrList.type;
    }

    verifyElem(x){
        Utils.typeIsOrCrash(x, AndList.type);

        return x;
    }

    show(){
        return `${OrList.type}(${this.showDelegate()})`;
    }

    getOrs(){
        return this.xs;
    }

    add(and){
        this.verifyElem(and);
        this.xs.push(and);
    }
}