import argparse
import json
from z3 import *

parser = argparse.ArgumentParser(description = 'z3 interface')
parser.add_argument('-constraints', '-c', type=str, default=None)
parser.add_argument('-ander', '-a', type=str, default='ander')
parser.add_argument('-orer', '-o', type=str, default='orer')
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
        return JSTy.To(to_type(nested['A']), to_type(nested['B']))
    else: # no other types are nested so we are done (HAVENT ACCOUNTED FOR COMPLEMENT)
        return z3_vars[nested['id']]

def unpack(joiner):
    

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
    if(join_t != args.ander and join_t != args.orer):
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

def main():
    constrs = json.loads(args.constraints)
    type_lookup = type_vars(constrs)
    type_list = list(type_lookup.keys())
    reply = {
        'reflect': constrs,
        'sol': None,
        'type_vars': type_list
    }
    #print(reply['debug'])
    solver = Solver()
    # the grammar for types 
    JSTy = Datatype('JSTy')
    JSTy.declare('Num')
    JSTy.declare('Ok')
    JSTy.declare('Comp', ('val', JSTy))
    JSTy.declare('To', ('lft', JSTy), ('rgt', JSTy))
    JSTy = JSTy.create()
    for name in type_list:
        type_lookup[name] = Const(name, JSTy)
    type_lookup[args.ok_shape] = JSTy.Ok
    type_lookup[args.num_shape] = JSTy.Num #adds an entry for constraints involving numbers and oks, without any extra logic 
    # create free variables 
    # flatten anders and orers
    #var_set = list(map(lambda x: Const(x, JSTy), reply['type_vars']))
    a = type_lookup['XB']
    b = type_lookup['XC']
    c = type_lookup['XE']
    
    
    #solve(b != JSTy.To(a, c))
    solver.add(Or(And(b == JSTy.To(a, c), (a == type_lookup[args.num_shape])), (type_lookup[args.ok_shape] == b)))
    solver.check()
    mod = solver.model()
    reply['sol'] = list(map(lambda x: {str(x): str(mod[x])}, mod)) 
    print(reply) #test to see if we can send the constraints back

if __name__ == '__main__':
    main()
