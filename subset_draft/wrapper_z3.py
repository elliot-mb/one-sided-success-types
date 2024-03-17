import argparse
import json
import pprint
from z3 import *

parser = argparse.ArgumentParser(description = 'z3 interface')
parser.add_argument('-constraints', '-c', type=str, default=None)
parser.add_argument('-ander_type', '-a', type=str, default='ander')
parser.add_argument('-orer_type', '-o', type=str, default='orer')
parser.add_argument('-constraint_type', '-ct', type=str, default='constraint')
parser.add_argument('-constraint_set_type', '-cst', type=str, default='constraintset')
parser.add_argument('-shape_field', '-s', type=str, default='shapeV')
parser.add_argument('-general_shape', '-g', type=str, default='A')
parser.add_argument('-ok_shape', '-k', type=str, default='Ok')
parser.add_argument('-num_shape', '-n', type=str, default='Num')
parser.add_argument('-arrow_shape', '-r', type=str, default='A -> B')
parser.add_argument('-typevar_type', '-tvt', type=str, default='GenT')
parser.add_argument('-constraint_file', '-cf', type=str, default=None)
args = parser.parse_args()


#
#
#   constraint to Z3 formula conversion 
#
#

def type_name(var):
    return var['id']

# z3_vars is the map of vars
def to_type(nested, const_lookup, JSTy):
    if(not args.shape_field in nested):
         raise Exception( 'to_type: supposed type \'nested\' has no shapeV field')
    shape = nested[args.shape_field]
    if(shape == args.arrow_shape):
        return JSTy.To(to_type(nested['A'], const_lookup, JSTy), to_type(nested['B'], const_lookup, JSTy))
    else: # no other types are nested so we are done (HAVENT ACCOUNTED FOR COMPLEMENT)
        return const_lookup[type_name(nested)]

# joiner ::= Ander | Orer | Constraint 
def unpack(joiner, const_lookup, JSTy):
    if(not ('type' in joiner or 'xs' in joiner)):
         raise Exception( 'unpack(): joiner must be Ander | Orer | Constraint (found without \'type\' or \'xs\' field)')
    join_t = joiner['type']
    if(join_t == args.ander_type):
        xs = joiner['xs']
        if(len(xs) == 1):
            return unpack(xs[0], const_lookup, JSTy)
        return And(list(map(lambda x: unpack(x, const_lookup, JSTy), xs)))
    if(join_t == args.orer_type):
        xs = joiner['xs']
        if(len(xs) == 1):
            return unpack(xs[0], const_lookup, JSTy)
        return Or(list(map(lambda x: unpack(x, const_lookup, JSTy), xs))) 
    if(join_t == args.constraint_type):
        return to_type(joiner['A'], const_lookup, JSTy) == to_type(joiner['B'], const_lookup, JSTy)
    else:
         raise Exception( 'unpack(): unrecognised type \'' + join_t + '\'')


#
#   
#   utilities 
#
#
    
def bound_in_constr_set(constr_set):
    ##print(constr_set)
    typevars = []
    if(not constr_set['type'] == args.constraint_set_type):
         raise Exception( 'bound_in_constr_set: constr_set must be of type constraint set')
    for x in constr_set['xs']:
        maybe_gen_t = x['A']
        if(not maybe_gen_t[args.shape_field] == args.general_shape):
             raise Exception( 'bound_in_constr_set: constraint x must have a left side which is a GenT')
        typevars.append(x['A']['id']) #left side is always a single GenT typevar

    return typevars

def flatten(xss):
    flat = []
    for xs in xss:
        for x in xs:
            flat.append(x)
    return flat

# joiner ::= Ander | Orer | Constraint | ArrowType | Typevar
def unwrap(joiner):
    if(not 'type' in joiner):
        return []
    join_t = joiner['type']
    if(join_t != args.ander_type and join_t != args.orer_type):
        if((not 'A' in joiner) and (not 'B' in joiner)):
            return [joiner['id']] # nest against flattener so strings dont get flattened
        else:
            # it is a constraint
            return flatten([unwrap(joiner['A']), unwrap(joiner['B'])])
    xs = joiner['xs'] # by the outer program, anything with type ander or orer will have an xs
    nested = list(map(lambda x: unwrap(x), xs))
    return flatten(nested)

def type_vars(joiner):
    unwrapped = unwrap(joiner)
    uniques = {} # empty dict
    for v in unwrapped:
        if(not (v == args.ok_shape or v == args.num_shape)): # 'Ok' and 'Num' arent type variables, theyre types 
            uniques[v] = None
    return uniques # return a dict which we populate with z3 types

def show_constrs(constrs):
    return str(constrs).replace('\n', '').replace('  ', '')

# iteratively acquires more solutions by constraining assignments against what they come up as 
# whitelist tells us which assignments to not try and negate (a list of variable names)
def make_solns(const_lookup, constrs, count, whitelist = [], blacklist = []):
    solns = [] # can be added to a dict, array of dicts  
    solver = Solver()
    solver.set(relevancy=2)
    solver.add(constrs)
    mod = None
    illegal_assign = False
    max_solves = count
    solve_count = 0
    ##print(solver)
    while(solver.check() == sat and not illegal_assign and (max_solves > solve_count)):
        mod = solver.model()
        #print(solver)
        #print(mod)
        mod_can_neg = []
        mod_must_neg = []
        sol = {} #new dict 
        for ass in mod:
            assStr = str(ass)
            if(ass.arity() == 0): #reassign constants
                sol[assStr] = mod[ass]
                neg = const_lookup[assStr] != mod[ass]
                if(not assStr in whitelist): #if its in the whitelist we shouldnt reassign
                    mod_can_neg.append(neg)
                if(assStr in blacklist):
                    #print('MUST REASSIGN ' + assStr)
                    mod_must_neg.append(neg)
            else:                     #print('reassign ' + assStr)
                illegal_assign = True
         
        mod_negation = Or(mod_can_neg)
        #print(mod_negation)
        solns.append(sol) 
        if(len(mod_must_neg) > 0):
            solver.add(And(mod_must_neg))
        #print(mod_negation, list(map(lambda x: x, mod)))
        solver.add(mod_negation)
        #print(solver)
        solve_count += 1

    return solns

def constrs_to_strs(m):
    new_map = {}
    for kv in m.items():
        new_map[kv[0]] = show_constrs(kv[1])
    return new_map

def solns_to_strs(solns):
    return list(map(lambda x: constrs_to_strs(x), solns))

#turn a single solution into a conjunction of constraints
def soln_to_constrs(soln, const_lookup):
    return And(list(map(lambda kv: const_lookup[kv[0]] == kv[1], soln.items())))

def soln_to_lookup(soln):
    new_lookup = {}
    for ass_kv in soln.items():
        new_lookup[ass_kv[0]] = ass_kv[1]
    return new_lookup

# variables assigned to in solutions (just gets teh keys of a dict)
def keys_in_dict(d):
    keys = []
    for kv in d.items():
        keys.append(kv[0])
    return keys

def vals_in_dict(d):  
    vals = []
    for kv in d.items():
        vals.append(kv[1])
    return vals

def main():
    MAX_DEPTH = 20 # how many solutions can we find up to (square this number)
    recieved = None
    if(not args.constraint_file == None): 
        recieved_f = open(args.constraint_file, 'r')
        #print(args.constraint_file)
        recieved_lns = ''    
        for ln in recieved_f:
            recieved_lns += ln + '\n'
        recieved = json.loads(recieved_lns)
    elif(not args.constraints == None):
        recieved = json.loads(args.constraints)
    #print(recieved)
    if(recieved == None):
        raise Exception('main: no file or json specified or provided')
    constrs = recieved['constrs']
    
    top_type = recieved['top_type']
    type_lookup = type_vars(constrs)
    type_list = list(type_lookup.keys())
    solns = []

    solver = Solver()
    solver.set(relevancy=2)
    # the grammar for types 
    JSTy = Datatype('JSTy')
    ComplTy = Datatype('ComplTy') # stops directly nested complements
    ComplTy.declare('Num')
    ComplTy.declare('Ok')
    ComplTy.declare('To', ('lft', JSTy), ('rgt', JSTy))
    
    JSTy.declare('Num')
    JSTy.declare('Ok')
    JSTy.declare('Comp', ('comp', ComplTy))
    JSTy.declare('To', ('lft', JSTy), ('rgt', JSTy))
    #JSTy.declare('Var', ('ident', StringSort()))
    JSTy, ComplTy = CreateDatatypes(JSTy, ComplTy)
    for name in type_list:
        type_lookup[name] = Const(name, JSTy)
    type_lookup[args.ok_shape] = JSTy.Ok
    type_lookup[args.num_shape] = JSTy.Num #adds an entry for constraints involving numbers and oks, without any extra logic 
    #type_lookup[args.arrow_shape] JSTy.
    term_type = type_lookup[str(type_name(recieved['term_type']))] #get it out of type_lookup
    all_constrs = unpack(constrs, type_lookup, JSTy)
    top_constrs = list(map(lambda x: unpack(x, type_lookup, JSTy), top_type['xs']))
    #print(top_constrs, term_type)
    #print(all_constrs)
    bound_in_top = bound_in_constr_set(top_type)
    
    #solver.add(And(JSTy.Comp(JSTy.Comp(JSTy)) == JSTy))
    solver.add(all_constrs)#Or(And(b == JSTy.To(a, c), (a == type_lookup[args.num_shape])), (type_lookup[args.ok_shape] == b)))
    
    # now show me its false
    # solver.add(to_type(top_type, type_lookup, JSTy) == JSTy.Comp(ComplTy.Ok))

    # first pass 
    solns = make_solns(type_lookup, all_constrs, MAX_DEPTH, whitelist = [], blacklist = [str(term_type)])
    
    # all solutions that dont interfere with the disjunctive toplevel constraints

    # top_solns = [] #nested list of toplevel types
    # for soln in solns:
    #     stripped_solns = {} #copy the relevant entries which wont conflict with the top types
    #     for kv in soln.items():
    #         if(not kv[0] in bound_in_top):
    #             stripped_solns[kv[0]] = kv[1]
    #     #print(stripped_solns)
    #     #top_solns.append(make_solns(soln_to_lookup(soln), top_constrs, 10))
    #     top_solns.append(make_solns(
    #         type_lookup, 
    #         And(soln_to_constrs(stripped_solns, type_lookup), *top_constrs), 
    #         MAX_DEPTH,
    #         whitelist=[keys_in_dict(stripped_solns)]))#whitelist all assignments previously generated!  
    
    def key_in_or_none(d, k):
        if k in d:
            return d[k]
        return 'Untypable' # no solution to constraints leads to assignment to result type 

    #top_solns.append(solns) # attach them incase all variables were solved in the first go (including the term type)

    # term_type_assignments = flatten(list(
    #     map(lambda x: list(
    #         map(lambda y: key_in_or_none(y, show_constrs(term_type)), solns_to_strs(x))), 
    #             top_solns)))
    
    term_type_assignments = list(map(lambda x: str(x[str(term_type)]), solns))
    #print(term_type_assignments)
    #just take the uniques 
    uniques = {}
    uniqueList = []
    for i in range(len(term_type_assignments)):
        uniques[term_type_assignments[i]] = None
    for type_str_none in uniques.items():
        uniqueList.append(type_str_none[0])

    reply = {
        #'reflect': recieved,
        #'term_type': show_constrs(term_type),
        #'top': show_constrs(Or(top_constrs)),
        #'term': show_constrs(all_constrs),
        'sol': solns_to_strs(solns),
        #'top_solns': list(map(lambda x: solns_to_strs(x), top_solns)),
        #'sol_conj': show_constrs(list(map(lambda x: soln_to_constrs(x, type_lookup), solns))),
        #'type_vars': type_list,
        'term_type_assignments': uniqueList,
        'term_type_assignments_all': term_type_assignments,
        'bound_in_top': bound_in_top
    }
    print(reply) #test to see if we can send the constraints back
    #pprint.pprint(reply)


if __name__ == '__main__':
    main()
