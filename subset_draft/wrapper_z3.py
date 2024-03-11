import argparse
import json
from z3 import *

parser = argparse.ArgumentParser(description = 'z3 interface')
parser.add_argument('-constraints', '-c', type=str, default=None)
parser.add_argument('-ander_type', '-a', type=str, default='ander')
parser.add_argument('-orer_type', '-o', type=str, default='orer')
parser.add_argument('-constraint_type', '-ct', type=str, default='constraint')
parser.add_argument('-shape_field', '-s', type=str, default='shapeV')
parser.add_argument('-general_shape', '-g', type=str, default='A')
parser.add_argument('-ok_shape', '-k', type=str, default='Ok')
parser.add_argument('-num_shape', '-n', type=str, default='Num')
parser.add_argument('-arrow_shape', '-r', type=str, default='A -> B')
args = parser.parse_args()


#
#
#   constraint to Z3 formula conversion 
#
#

# z3_vars is the map of vars
def to_type(nested, z3_vars, JSTy):
    if(not args.shape_field in nested):
        raise 'to_type: supposed type \'nested\' has no shapeV field'
    shape = nested[args.shape_field]
    if(shape == args.arrow_shape):
        return JSTy.To(to_type(nested['A'], z3_vars, JSTy), to_type(nested['B'], z3_vars, JSTy))
    else: # no other types are nested so we are done (HAVENT ACCOUNTED FOR COMPLEMENT)
        return z3_vars[nested['id']]

# joiner ::= Ander | Orer | Constraint 
def unpack(joiner, z3_vars, JSTy):
    if(not ('type' in joiner or 'xs' in joiner)):
        raise 'unpack(): joiner must be Ander | Orer | Constraint (found without \'type\' or \'xs\' field)'
    join_t = joiner['type']
    if(join_t == args.ander_type):
        xs = joiner['xs']
        if(len(xs) == 1):
            return unpack(xs[0], z3_vars, JSTy)
        return And(list(map(lambda x: unpack(x, z3_vars, JSTy), xs)))
    if(join_t == args.orer_type):
        xs = joiner['xs']
        if(len(xs) == 1):
            return unpack(xs[0], z3_vars, JSTy)
        return Or(list(map(lambda x: unpack(x, z3_vars, JSTy), xs))) 
    if(join_t == args.constraint_type):
        return to_type(joiner['A'], z3_vars, JSTy) == to_type(joiner['B'], z3_vars, JSTy)
    else:
        raise 'unpack(): unrecognised type \'' + join_t + '\''
#
#   
#   utilities 
#
#

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

def main():
    recieved = json.loads(args.constraints)
    #print(recieved)
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
    base_constraints = unpack(constrs, type_lookup, JSTy)
    #solver.add(And(JSTy.Comp(JSTy.Comp(JSTy)) == JSTy))
    solver.add(base_constraints)#Or(And(b == JSTy.To(a, c), (a == type_lookup[args.num_shape])), (type_lookup[args.ok_shape] == b)))
    
    # now show me its false
    solver.add(to_type(top_type, type_lookup,) == JSTy.Comp(ComplTy.Ok))
    # solnser = all_smt(solver, base_constraints)
    # solnss = [(solnser)]
    mod = None
    illegal_assign = False
    max_types = 5
    type_count = 0
    while(solver.check() == sat and not illegal_assign and (max_types > type_count)):
        #print(solver)
        mod = solver.model()
        #print(mod)
        mod_neg = []
        sol = {}
        for ass in mod:
            if(ass.arity() == 0): #reassign constants
                sol[show_constrs(ass)] = show_constrs(mod[ass])
                #print("" + str(ass) + " = " + str(mod[ass]))
                mod_neg.append(type_lookup[str(ass)] != mod[ass])
            else: 
                illegal_assign = True

        mod_negation = Or(mod_neg)
        #print(mod_negation)
        solns.append(sol) 
        #print(mod_negation, list(map(lambda x: x, mod)))
        solver.add(mod_negation)
        type_count += 1

    
    reply = {
        'reflect': recieved,
        'term': show_constrs(base_constraints),
        #'simple_term': show_constrs(simplify(base_constraints)),
        'sol': solns,
        'type_vars': type_list
    }
    print(reply) #test to see if we can send the constraints back

if __name__ == '__main__':
    main()
