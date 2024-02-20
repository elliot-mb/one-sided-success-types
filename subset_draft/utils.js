import {GenT} from './typevar.js';
import {typeToGrammar} from './aw_ast.js';

export class Utils{

    /**
     * 
     * @param {*} message 
     * @returns a useful error with the stack trace!
     */
    static makeErr = (message) => new Error(message).stack;

    static firstCharCode = 'A'.charCodeAt(0);
    static lastCharCode = 'Z'.charCodeAt(0);
    static rollsover = (char) => char.charCodeAt(0) + 1 > Utils.lastCharCode;
    static incrementLetter = (char) => {
        const code = char.charCodeAt(0);
        return Utils.rollsover(char) ? 'A' : String.fromCharCode(code + 1);
    }

    static isEmpty(xs){
        if(xs.length === undefined) throw Utils.makeErr(`isEmpty: xs '${xs}' has no property length`);
        return xs.length === 0;
    }

    /**
     * takes a list of bools and returns true if any of them are true 
     **/
    static any(bs){
        return bs.reduce((acc, b) => acc || b, false);
    }

    static all(bs){
        return bs.reduce((acc, b) => acc && b, true);
    }

    static last(xs){
        if(Utils.isEmpty(xs)) throw Utils.makeErr(`last: list is empty`);
        return xs[xs.length - 1];
    }

    /**
     * returns either a string or '#' signifying it has rolled over (we obviously know what it will be?)
     * **/
    static nextFreeTypeName = (typeName) => {
        if(typeof(typeName) !== 'string') throw Utils.makeErr('nextFreeTypeName: typeName must be a string');
        let newName = `${typeName}`;
        let carry = false;
        for(let i = newName.length - 1; i >= 0; i--){ 
            const char = newName[i];
            if(i === newName.length - 1 || carry){
                newName = `${newName.slice(0, i)}${Utils.incrementLetter(char)}${newName.slice(i + 1)}`;
                carry = Utils.rollsover(char);
            }else{
                carry = false;
            }
        }
        if(carry){
            newName = `A${newName}`;
        }
        return newName;
    }

    static typeVarsOrCrash = (A, B) => {
        try{
            if(A.type !== GenT.type) throw Utils.makeErr('typeVarsOrCrash: A must be a \'typevar\'');
            if(B.type !== GenT.type) throw Utils.makeErr('typeVarsOrCrash: B must be a \'typevar\'');
        }catch(err){
            console.log(`typeVarsOrCrash: object dump A`);
            console.log(A);
            console.log(`typeVarsOrCrash: object dump B`);
            console.log(B);
            throw Utils.makeErr('typeVarsOrCrash: A or B was not a typevar: ' + err);
        }
    }
    static typeVarOrCrash = (A) => {
        if(A.type !== GenT.type) throw Utils.makeErr('typeVarOrCrash: A must be a \'typevar\'');
    }
    static termOrCrash = (M) => {
        if(M.type === undefined) throw Utils.makeErr('termOrCrash: M does not have a type property and so does not represent an AST node');
        //const isValidNodeType = Object.keys(typeToGrammar).map(nodeT => M.type === nodeT).reduce((acc, b) => acc || b, false);
        if(typeToGrammar[M.type] === undefined) throw Utils.Utils.makeErr('termOrCrash: M does not have a type property which belongs to the grammar');
    }

    static isType = (t, ...is) => {
        return Utils.any(is.map(x => t.type === x)); 
    }

    static typeIsOrCrash = (t, ...is) => {
        if(t.type === undefined) throw Utils.makeErr(`typeIsOrCrash: t (${JSON.stringify(t)}) has no \'type\' property`);
        const isCorrectType = Utils.isType(t, ...is); 
        if (!isCorrectType) throw Utils.makeErr(`typeIsOrCrash: t is a '${t.type}' when it needs to be one of '${is}'`);
    }

    // static goodShapeOrCrash = (shape) => {
    //     if(Term.allShapes[shape] === undefined) throw 'goodShapeOrCrash: there is no '
    // }

    //makes type variables more readable (e.g. (T2 -> T2) -> T2 -> T2 becomes (A -> A) -> A -> A)
    static downgradeTypes = (T) => {
        Utils.typeVarOrCrash(T);
        const allUniqueTypes = T.freeIn();
        let freshT = String.fromCharCode(Utils.firstCharCode);
        for(let i = 0; i < allUniqueTypes.length; i++){
            T.rename(allUniqueTypes[i], freshT);
            freshT = Utils.nextFreeTypeName(freshT);
        }
    }


    /**
     * finds the indices of repeated elements that are .equal(test) 
     * @param {*} xs must all have .equals method
     * @param {*} test 
     */
    static whereRepeated = (xs, test) => {
        const acc = [];
        for(let i = 0; i < xs.length; i++){
            const x = xs[i];
            if(x !== null && x.equals(test)) acc.push(i);
        }
        return acc;
    }

    /**
     * 
     * this method is ~O(n^2)
     * 
     * @param {*} xs a list of things with an .equals(elment of type xs[i]) method
     * @returns {*} xs without any repeated elements 
     */
    static removeRepeats = (xs) => {
        if(Utils.any(xs.map(x => x.equals === undefined))) throw Utils.makeErr('removeRepeats: all elements must have an xs method');

        for(let i = 0; i < xs.length; i++){
            const x = xs[i];
            if(x !== null){
                const repeats = Utils.whereRepeated(xs, x);
                repeats.map(n => { //'delete' elements in front of the current one (without array moves)
                    if(n !== i) xs[n] = null;
                });
            }
    
        }
    
        return xs.filter(x => x !== null);
    }


}
