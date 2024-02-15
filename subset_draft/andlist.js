import {Utils} from './utils.js';
import {OrList} from './orlist.js';
import {Constraint} from './constraint.js';
import {TypedList} from './typedlist.js';

//a set of OrSets understood conjunctively
//or a set of constraints, which would usually be in a ConstraintSet but this is
//our new ConstraintSet
export class AndList extends TypedList{
    static type = 'andlist';

    constructor(...orsOrConstraints){ //can be just a single constraint as well!
        super(orsOrConstraints);
        this.type = AndList.type;
    }

    verifyElem(x){
        try{
            Utils.typeIsOrCrash(x, OrList.type);
        }catch(err){
            Utils.typeIsOrCrash(x, Constraint.type);
        }

        return x;
    }

    show(){
        return `${AndList.type}(${this.showDelegate()})`;
    }

}