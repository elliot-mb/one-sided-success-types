// testing https://github.com/acornjs/acorn which includes
// the ast walker https://github.com/acornjs/acorn/tree/master/acorn-walk/
// testing with bun


/**
 * 
 * final grammar for functions
 * 
 * structural
 * 
 * P, Q ::= const x = M; P | M; P | empty
 * converted to
 * Program ::= E[]
 * 
 * rules for
 * 
 * E, F ::= const x = M; E | return M;
 * M, N ::= x | n | M o N | x => M | {E} | M(N) | M <= 0 ? N : P
 * V, W ::= x | n | x => M 
 * 
 */

import { Parser } from 'acorn';
import { full } from 'acorn-walk';
import { modRequire } from './module_require.js';
import {writeFileSync} from 'fs';
import {Utils} from './utils.js';
import {Rule} from './rule.js';

const parse = (prog) => Parser.parse(prog, {ecmaVersion: 2023});
const PROGRAM_T = 'Program';

// writes the tree output as a nicely spaced string
export const pretty = json => `{\r\n${pret(json, '  ')}\r\n}`;
const pret = (json, whitespace = '') => {  // gives an array of lines to the tree_file
    if(json === undefined) throw Utils.makeErr(`pret: json not defined`);

    const isArr = Array.isArray(json); //a flag to stop us printing object key names if we are an array(array indices)
    
    const ks = Object.keys(json);
    if(ks.length === 0) return [];

    const keys_copy = ks.map(k => `${k}`) ;
    const toKey = (i) => isArr ? '' : `"${keys_copy[i]}": `; //we can stop outputting keys if we are an array

    const lines = ks //just the lines that show all the nested objects
        .map(key => json[key]) //the nested objects
        .map((value, i) => Array.isArray(value) //is this value an array
            ? [`${whitespace}${toKey(i)}[\r\n`] + pret(value, whitespace + `  `) + [`\r\n${whitespace}],`]
            : typeof(value) === 'object' && value !== null
                ? [`${whitespace}${toKey(i)}{\r\n`] + pret(value, whitespace + `  `) + [`\r\n${whitespace}},`]
                : `${whitespace}${toKey(i)}${JSON.stringify(value)},`); //stringify handles whether we need quotes
            // : typeof(value) === 'array' 
            //     ? console.log('array')
            
    const blockString = lines.reduce((acc, x) => `${acc}\r\n${x}`).slice(0, -1); //in a block of terms there is a single comma on the end, remove this 

    return blockString;
};

//a map from AST types to maps from subterm names (M, N, P, m, n) to their 
//fields in the AST object
// the 'fields' are arrays string[] where each property must be used in order
// to retrieve the property (most are just one long (singleton arrays))
const typeToSubterms = modRequire('./AST_subtm.json');

//a map from AST types to grammar shapes 
/*
 * E, F ::= const f = x => M; E | const x = M; E | return M;
 * M, N ::= x | n | M o N | x => M | {E} | M(N) | M <= 0 ? N : P (| M but not explicitly included)
 * */
export const typeToGrammar = modRequire('./AST_grmmr.json');
export const E = [
    typeToGrammar['VariableDeclaration'],
    typeToGrammar['ReturnStatement'],
];
export const M = [
    typeToGrammar['Literal'],
    typeToGrammar['BinaryExpression'],
    typeToGrammar['ArrayExpression'],
    typeToGrammar['ArrowFunctionExpression'],
    typeToGrammar['ConditionalExpression'],
    typeToGrammar['Identifier'],
    typeToGrammar['BlockStatement']
]

//a map from AST types to maps from specific fields to restrictions they must obey
//in an effort to express whats permitted in the subset of the language
//a list of restrictions is disjunctive or conjunctive, based on the symbol 'ANY' or 'ALL' resp.
//in the 'satisfies' field of the object that holds the restriction list 
const typeToProperties = modRequire('./AST_require.json');

const accessSubterm = (steps, startTerm) => {
    let tempField = startTerm; // reassigned
    steps.forEach((step) => tempField = tempField[step]); 
    return tempField
}

//turns the root node of the term's type to the grammar shape
// as a string
export const termShape = (term) => {
    const FST = 0;
    const SND = 1;
    let select = FST;
    if(term.type === undefined) throw Utils.makeErr(`termShape: term has no 'type' field`);
    
    //we add an exception just for the AST which has two grammar shapes 
    let shapesByAST = typeToGrammar[term.type];
    if(shapesByAST[select] === Rule.compo){
        const mShape = termShape(accessSubterm(typeToSubterms[term.type][Rule.compo]['M'], term)); //this will only recurse once at most
        if(mShape === Rule.abs){
            select = SND;
        }
    }

    //console.log(`SHAPE ${shapesByAST[select]}`);
    return shapesByAST[select];
    
}

//gets a subterm based on a term and the name in the grammar.
//throws an error if a name is used thats not in the grammar for that term type.
//this function should be used to traverse the tree in a way that corresponds
//to the shapes of terms.
export const getSubterm = (term, subtermName) => {
    
    if(subtermName === undefined) throw Utils.makeErr(`getSubterm: subtermName was not given`);
    if(term.type === undefined) throw Utils.makeErr(`getSubterm: term has no 'type' field `);
    const shape = termShape(term);
    const nameToSubterm = typeToSubterms[term.type][shape]; //shape to subterms
    //console.log(nameToSubterm);
    if(nameToSubterm === undefined) throw Utils.makeErr(`getSubterm: term of 'type' '${term.type}' does not exist in the grammar`);

    if(nameToSubterm[subtermName] === undefined) throw Utils.makeErr(`getSubterm: term ${JSON.stringify(term)} of shape '${shape}' ` + `has no subterm called '${subtermName}'`);

    //we know the AST term to subterm map, we perform the access steps in the 
    //map in order to return the sub-AST-object/subterm object
    const steps = nameToSubterm[subtermName];
    let tempField = accessSubterm(steps, term);
    
    if(tempField === undefined) throw Utils.makeErr(`getSubterm: steps [${steps}] gives ${JSON.stringify(tempField)} on this term` +
    `of shape '${shape}' (${JSON.stringify(term)} ) for '${subtermName}' did not succeed due to undefined field`);
    return tempField;
}

const ruleNameArg = rule => {
    const nameAndArg = rule[func];
    const names = Object.keys(nameAndArg);
    if(names.length !== 1) throw Utils.makeErr(`checkRule: function specifier has the wrong number of fields`);
    const name = names[0];
    const arg = nameAndArg[name]; //gets the function argument from the pair
    return {"name": name, "arg": arg};
}

const deleteSpecials = (original, special) => {
    const afterDeletes = Array.from(original)
        .filter(c => c === special ? '' : c)
        .reduce((xs, x) => `${xs}${x}`, '');
    return afterDeletes;
}

//rule is the current level we are in the rule chain (element of the rules array)
//value is initially the value of the field the rules are applied to, but it changes
//depending on whether any property accesses are made (its then set to that property value)
//fieldname is just for informative errors (says what field we're checking)
const checkRule = (rule, objOrValue, fieldname) => {
    //crashes if rule is not satisfied
    // specification: "F" as a key => value is an object of <function name> : <operand> 
    //                "P" as a key => value is an object of <property name> : <requirement>
    //                <requirement> is an object with either "F" or "P" as a single key
    const special = '%'; //expands to special accessors
    const func = 'F';
    const prop = 'P';
    const propAccessors = {
        'last': xs => {
                if(xs.length === undefined) throw Utils.makeErr('checkRule: requires the property is a list');
                if(xs.length === 0) throw Utils.makeErr('checkRule: the property is a list of length at least one');
                return `${xs.length - 1}`;
            }
    }
    const funcs = { //all functions referred to in the type_require.json
        'equals': v => x => v === x, //take the value and the argument of the rule
        'typeof': v => x => typeof(v) === x,
        // 'lastEquals': v => xs => {
        //     if(xs.length === undefined) throw new Utils.makeErr('checkRule.funcs[\'last\'] requires the property is a list');
        //     if(xs.length === 0) throw new Utils.makeErr('checkRule.funcs[\'last\'] requires the property is a list of length at least one');
        //     return v === xs[xs.length - 1];
        // }
    };

    if(rule === undefined) throw Utils.makeErr(`checkRule: rule not defined`);
    const ruleTypes = Object.keys(rule);
    if(ruleTypes.length !== 1) throw Utils.makeErr(`checkRule: rule has the wrong number of fields`);
    const ruleType = ruleTypes[0];
    if(ruleType === func){ //no more recursion
        const funcNameArg = rule[func];
        const funcNames = Object.keys(funcNameArg);
        if(funcNames.length !== 1) throw Utils.makeErr(`checkRule: function specifier has the wrong number of fields`);

        const funcName = funcNames[0];
        const useFunc = funcs[funcName]; //function to use the value and arg with
        const funcArg = funcNameArg[funcName]; //gets the function argument from the pair
        //console.log(funcArg, objOrValue);
        const isOk = useFunc(objOrValue)(funcArg);
        if(!isOk) throw Utils.makeErr(`checkRule: property violates '${funcName}' check on '${objOrValue}' and '${funcArg}', for '${fieldname}'`);
        return;
    }
    if(ruleType === prop){
        const propNameRule = rule[prop];
        const propNames = Object.keys(propNameRule);
        if(propNames.length !== 1) throw Utils.makeErr(`checkRule: property specifier has the wrong number of fields`);
        const propName = propNames[0];
        const newRule = propNameRule[propName]; //recurses inside the rule spec
        let newObjOrValue;
        if(propName[0] === special){
            const afterDeletes = deleteSpecials(propName, special);
            newObjOrValue = objOrValue[propAccessors[afterDeletes](objOrValue)];
        }else { newObjOrValue = objOrValue[propName]; } //fetches current obj context
        checkRule(newRule, newObjOrValue, propName);
        return;
    }
    throw Utils.makeErr(`checkRule: unexpected token '${ruleType}' which is not a recongised rule type`);
}

export const checkTerm = term => {
    //                rules are built around property names, like
    /**
     * {
     *      <ast_type> : {
     *          <field_rules_are_applied_to>: {
     *              "satisfies": "ANY" | "ALL" | "NONE", 
     *              "rules": <requirement>[]
     *          },
     *          <field_rules_are_applied_to>: {...}
     *      }
     * ...
     * }
     */

    //tokens for the specification
    const special = '%'; //this is ignored when checking field names which 
    //allows us to have more than one set of rules for the same field name 
    const stfy = 'satisfies';
    const ruls = 'rules';
    const sAny = 'ANY';
    const sAll = 'ALL';
    const sNone = 'NONE';
    const rAny = x => y => x || y;
    const rAll = x => y => x && y;
    const rNone = x => y => x && !y;
    const sRMap = {
        'ANY': rAny,
        'ALL': rAll,
        'NONE': rNone
    };
    const sAccMap = { //what we start the accumulator as 
        'ANY': false,
        'ALL': true,
        'NONE': true
    }

    if(term === undefined) throw Utils.makeErr(`checkTerm: term not defined`);
    if(term.type === undefined) throw Utils.makeErr(`checkTerm: term.type not defined`);
    const checkFields = typeToProperties[term.type]; 
    if(checkFields === undefined) throw Utils.makeErr(`checkTerm: there is no term of type '${term.type}' in the grammar`);
    //remove the special characters from the field names 
    const propsEnforced = Object.keys(checkFields);

    propsEnforced.map(field => { //field under this type of term in the AST
        const ruleset = checkFields[field];
        field = deleteSpecials(field, special);//remove the special characters from the field names 
        const sat = ruleset[stfy];
        if(sat === undefined) throw Utils.makeErr(`checkTerm: ruleset is missing the 'satisfies' property`);
        const reducer = sRMap[sat];
        //console.log(reducer, ruleset[stfy])   ;
        if(ruleset[ruls].length === 0) throw Utils.makeErr(`checkTerm: rulesets must have at least one rule`);
        const fails = [];
        const isOk = ruleset[ruls]
            .map((rule, i) => {
                try{
                    checkRule(rule, term[field], field);
                }catch(err){
                    fails.push(`${i}: ${err}`);
                    return false;
                }
                return true; //we need to not crash out in teh case that rAny is selected
            })
            .reduce((acc, x) => reducer(acc)(x), sAccMap[sat]);
        if(!isOk) throw Utils.makeErr(`checkTerm: '${ruleset[stfy]}' rule(s) in ruleset not met:\r\n${fails.join('\r\n')}`);

    });
}

//                           v allows us to specify what we do not want 
const getAllSubterms = (ast, except = []) => {
    const shape = termShape(ast);
    const subtermNames = Object.keys(typeToSubterms[ast.type][shape]).filter(n => !Utils.any(except.map(x => x === n)));
    //console.log(subtermNames + 'without' + except);
    return subtermNames.map(subtermName => getSubterm(ast, subtermName));
}

//verifies that the term uses just the expected shapes of subterms all the way down
export const checkGrammar = (term, initialDeclr = false) => {
    if(term === undefined) throw Utils.makeErr(`checkGrammar: term is not defined`);
    //base case where the term evalutes to raw strings or numbers
    if(typeof(term) !== 'object') return;
    //console.log(term);
    if(term.type === undefined) throw Utils.makeErr(`checkGrammar: term has no 'type' field`);
    if(typeToSubterms[term.type] === undefined) throw Utils.makeErr(`checkGrammar: there is no term of type '${term.type}' in the grammar`);
    //gets set false as soon as we pass the first (toplevel) const
    let subterms;
    try{
        checkTerm(term);  
        subterms = getAllSubterms(term, initialDeclr ? ['E'] : []);
        if(termShape(term) === 'const x = M; E'){
            initialDeclr = false;
        }
        subterms.map(subterm => checkGrammar(subterm, initialDeclr));
    }catch(err){
        throw Utils.makeErr(`checkGrammar: term shape '${typeToGrammar[term.type]}' failed since ${err}`);
    }
    // here, we know the term is written just using the specification in ./type_subtm.json
}

// /**
//  * 
//  * @param {*} term AST (valid term, since no error checks are done here)
//  * @returns the AST as a string
//  */
// export const termToString = term => {
//     const subtermNames = Object.keys(typeToSubterms[term.type]);
//     checkTerm(term);  
//     const subterms = subtermNames.map(subtermName => getSubterm(term, subtermName));
//     subterms.map(subterm => checkGrammar(subterm));
// }

/**
 * recurseAST is supposed to recurse the arrays inside blockstatements to use
 * letrec type reasoning 
 * we dont recurse on 'E' in var declarations  
 * @param {*} ast 
 */
const recurseAST = (ast) => {
    const astType = ast.type;
    if(astType === undefined) return;
    if(termShape(ast) === '{E}'){
        const xs = getSubterm(ast, 'E'); //each term in the body
        if(xs.length === undefined) return; //we have already handled this term! it does not have a list body
        //console.log(xs);
        for(let i = 0; i < xs.length - 1; i++){
            recurseAST(xs[i]);
            xs[i]['next'] = xs[i + 1];
        }
        //console.log(`set by ${JSON.stringify(typeToSubterms[astType]['{E}']['E'][0])}`)
        ast['body'] = xs[0];
        return;
    }
    const dontRecurse = ['E'];
    // except E (Es can only be accessed like this after recurseAST has run)
    const subterms = getAllSubterms(ast, dontRecurse); 
    subterms.map(x => recurseAST(x));
}

//just first expression argument is there while we only have single expressions
export const toASTTrees = (program, justFirstExpression = false, enforceGrammar = true) => {
    //console.log(`${program} to AST Tree`);
    let tree = {};
    let ret = {};
    full(parse(program), (node) => {
        if(node.type === PROGRAM_T){
            tree = node;
        }
    });
    ret = tree['body'];
    ret.map(x => recurseAST(x));
    //console.log(pretty(tree['body']));
    if(enforceGrammar) ret.map(x => checkGrammar(x, true));
    if(justFirstExpression) ret = ret[0]['expression'];
    
    return ret;
}

export const showsTree = async (name, program) => {
    const f = `./${name}.json`;
    writeFileSync(f, pretty(toASTTrees(program, false, false)));
    //await Bun.write(f, pretty(toASTTree(program, true, false)));
}