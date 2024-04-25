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
parser.add_argument('-comp_shape', '-cs', type=str, default='!A')
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

# string of type 
# def to_type_str(nested):
#     if(not args.shape_field in nested):
#          raise Exception( 'to_type: supposed type \'nested\' has no shapeV field')
#     shape = nested[args.shape_field]
#     if(shape == args.arrow_shape):
#         return '(' + to_type_str(nested['A']) + ') -> ' + to_type_str(nested['B'])
#     if(shape == args.comp_shape):
#         return 'Comp()' + (to_type_str(nested['A'])) + ')'
#     if(shape == args.ok_shape):
#         return 'Ok'
#     if(shape == args.num_shape):
#         return 'Num'
#     else: # no other types are nested so we are done 
#         return nested['id']


# z3_vars is the map of vars
def to_jsty_type(nested, const_lookup, JSTy):
    if(not args.shape_field in nested):
         raise Exception( 'to_type: supposed type \'nested\' has no shapeV field')
    shape = nested[args.shape_field]
    if(shape == args.arrow_shape):
        return JSTy.To(to_jsty_type(nested['A'], const_lookup, JSTy), 
                       to_jsty_type(nested['B'], const_lookup, JSTy))
    if(shape == args.comp_shape):
        return JSTy.Comp(to_jsty_type(nested['A'], const_lookup, JSTy))
    if(shape == args.ok_shape):
        return JSTy.Ok
    if(shape == args.num_shape):
        return JSTy.Num
    else: # no other types are nested so we are done 
        return const_lookup[type_name(nested)] 

# joiner ::= Ander | Orer | Constraint 
def unpack(joiner, const_lookup, JSTy):
    #    print('JOINER ', joiner)

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
        return to_jsty_type(joiner['A'], const_lookup, JSTy) == to_jsty_type(joiner['B'], const_lookup, JSTy)
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

# joiner ::= Ander | Orer | Constraint | ArrowType | Typevar | Comp
def unwrap(joiner):
    if(not 'type' in joiner):
        return []
    join_t = joiner['type']
    #print(joiner)
    if(join_t != args.ander_type and join_t != args.orer_type):
        if(args.shape_field in joiner):
            shape = joiner[args.shape_field]
            # Num | A -> B | A^c | Ok | A
            if(shape == args.general_shape):
                return [joiner['id']] # nest against flattener so strings dont get flattened
            if(shape == args.arrow_shape):
                return flatten([unwrap(joiner['A']), unwrap(joiner['B'])])
            if(shape == args.comp_shape):
                return flatten([unwrap(joiner['A'])])
            if(shape == args.ok_shape):
                return []
            if(shape == args.num_shape):
                return []
        else:
            # it is a constraint
            #print(joiner)
            return flatten([unwrap(joiner['A']), unwrap(joiner['B'])])
    #print(joiner)
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
def make_solns(const_lookup, constrs, count, we_care_names, JSTy):
    # # the grammar for types 
    # JSTy = Datatype('JSTy')

    # JSTy.declare('Num')
    # JSTy.declare('Ok')
    # JSTy.declare('To', ('lft', JSTy), ('rgt', JSTy))
    # # lft and rgt are always total
    # JSTy.declare('Comp', ('comp', JSTy))#C))
    # # comp is always total 

    solns = [] # can be added to a dict, array of dicts  
    solver = Solver()
    solver.set(relevancy=2)
    solver.add(constrs)

    tyVarA = Const('tyVarA', JSTy)
    tyVarB = Const('tyVarB', JSTy)
    solver.add(ForAll([tyVarA, tyVarB], JSTy.To(tyVarA, tyVarB).arg(0) == tyVarA))
    solver.add(ForAll([tyVarA, tyVarB], JSTy.To(tyVarA, tyVarB).arg(1) == tyVarB))
    solver.add(ForAll([tyVarA], JSTy.Comp(tyVarA).arg(0) == tyVarA))

    mod = None
    illegal_assign = False
    max_solves = count
    solve_count = 0

    we_care_typestr = list(map(lambda type: str(type), we_care_names))
    #print(we_care_names)

    while(solver.check() == sat and not illegal_assign and (max_solves > solve_count)):
        mod = solver.model()
        mod_can_neg = []
        sol = {} #new dict 
        uncared_for_typestrs = list(map(lambda type: str(type), we_care_names))
        for ass in mod:
            assStr = str(ass)
            #print(assStr)
            # if(not assStr in we_care_typestr):
            #     mod_can_neg.append(neg)

            if(ass.arity() == 0 ): #save solution and reassign constants
                #print(assStr)
                #must happen inside the arity check
                neg = const_lookup[assStr] == JSTy.Comp(JSTy.Ok) #!= mod[ass]
                sol[assStr] = mod[ass]
                if((str(mod[ass]) != str(JSTy.Comp(JSTy.Ok))) and assStr in we_care_typestr):
                    mod_can_neg.append(neg) 
                if(str(mod[ass]) == str(JSTy.Comp(JSTy.Ok)) and assStr in we_care_typestr):
                    solver.add(neg) # this is anded, fix those compers 
                if(assStr in we_care_typestr):
                    uncared_for_typestrs.remove(assStr)
            else:                     #print('reassign ' + assStr)
                #print('ILLEGAL ASSIGN to ' + assStr)
                sol[assStr] = mod[ass]
                illegal_assign = True
        
        for s in uncared_for_typestrs:
            if(s.find('To(') == -1): #we shall not negate functions 
                mod_can_neg.append(const_lookup[s] == JSTy.Comp(JSTy.Ok))

        # for ty in we_care_names:
        #     assStr = str(ty)
        #     neg = const_lookup[assStr] == JSTy.Comp(JSTy.Ok) #!= mod[ass]
        #     if(not ty in mod):
        #         mod_can_neg.append(neg)
        
        mod_negation = Or(mod_can_neg)
        #print(mod_negation)
        if(not illegal_assign):
            solns.append(sol) 
        # if(len(mod_must_neg) > 0):
        #     solver.add(And(mod_negation))
        solver.add(mod_negation)
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

def uniques_in_list(xs):
    uniques = {}
    unique_list = []
    for i in range(len(xs)):
        uniques[xs[i]] = None
    for type_str_none in uniques.items():
        unique_list.append(type_str_none[0])
    return unique_list

# this is for usability we remove the ok typings 
def remove_ok_strs(xs, JSTy):
    no_ok = []
    for x in xs:
        if not x == str(JSTy.Ok):
            no_ok.append(x)

    return no_ok

def main():
    
    recieved = None
    if(not args.constraint_file == None): 
        recieved_f = open(args.constraint_file, 'r')
        recieved_lns = ''    
        for ln in recieved_f:
            recieved_lns += ln + '\n'
        recieved = json.loads(recieved_lns)
    elif(not args.constraints == None):
        recieved = json.loads(args.constraints)
    if(recieved == None):
        raise Exception('main: no file or json specified or provided')
    
    env = recieved['env']['typings']
    constrs = recieved['constrs']
    #print(env)

    type_lookup = type_vars(constrs)
    type_list = list(type_lookup.keys())

    tld_var_list = list(env.keys())
    tld_general_type_vars = []
    for var_name in tld_var_list:
        var_type = env[var_name]
        shape = var_type[args.shape_field]
        if(shape == args.general_shape):
            tld_general_type_vars.append(var_name)
        if(shape == args.arrow_shape):
            tld_general_type_vars.append(var_name)
    MAX_SOLNS = len(tld_general_type_vars) 
    # the rationale behind this is that if every statement goes wrong, then
    # there will be n iterations one for each statement that fixes it as wrong and
    # tries to type another as wrong until its done

    solns = []

    # the grammar for types 
    JSTy = Datatype('JSTy')

    JSTy.declare('Num')
    JSTy.declare('Ok')
    JSTy.declare('To', ('lft', JSTy), ('rgt', JSTy))
    # lft and rgt are always total
    JSTy.declare('Comp', ('comp', JSTy))#C))
    # comp is always total 

    JSTy = JSTy.create()

    # try to stop it assigning to lft and right?
    # l = FreshConst(JSTy)
    # r = FreshConst(JSTy)
    # RecAddDefinition(JSTy.lft, l, l)
    # RecAddDefinition(JSTy.rgt, r, r)

    #testing printing
    # myTypeVar = JSTy.Ok
    # myArrow = JSTy.To(myTypeVar, myTypeVar)
    # #('cool_it_bro', JSTy).arg(0)
    # Function('namer', JSTy, JSTy).params()
    # print(myTypeVar)
    # print(str(myArrow.params().pop()))

    for name in type_list:
        type_lookup[name] = Const(name, JSTy) # ComplTy can be put inside comps

    term_type = type_lookup[str(type_name(recieved['term_type']))] #get it out of type_lookup
    all_constrs = unpack(constrs, type_lookup, JSTy)
    #print(all_constrs)
    wrong_all_var_typings = []
    wrong_all_var_types = []

    for var_name in tld_general_type_vars:
        var_type = env[var_name]
        #print(var_type)
        shape = var_type[args.shape_field]
        type_z3 = to_jsty_type(var_type, type_lookup, JSTy)
        wrong_all_var_typings.append(type_z3 == JSTy.Comp(JSTy.Ok))
        wrong_all_var_types.append(type_z3)
        #print('WRONG TYPING' + str(type_z3))


    at_least_one_false_assm = And(all_constrs, Or(wrong_all_var_typings))
    #all_and_show_me_false = And(all_constrs, term_type == JSTy.Comp(JSTy.Ok))
    #bound_in_top = bound_in_constr_set(top_type)

    solns = make_solns(type_lookup, at_least_one_false_assm, MAX_SOLNS, wrong_all_var_types, JSTy)
    #all_solns = make_solns(type_lookup, all_constrs, MAX_DEPTH)

    def term_ass(xs): 
        result = {}
        any_fails = []
        i = 0
        for var_name in tld_general_type_vars:
            result[var_name] = []
            #print(var_name)
            ty = env[var_name]
            var_shape = ty[args.shape_field]
            var_type = str(to_jsty_type(ty, type_lookup, JSTy))
            j = 0
            assigned = {}
            for x in xs:
                if var_shape == args.arrow_shape: # non-recursive because theyre only singly nested by the rule 
                    a_ty = str(to_jsty_type(ty['A'], type_lookup, JSTy))
                    b_ty = str(to_jsty_type(ty['B'], type_lookup, JSTy))
                    a_ass_str = None
                    b_ass_str = None
                    if a_ty in x:
                        a_ass_str = str(x[a_ty])
                    if b_ty in x:
                        b_ass_str = str(x[b_ty])
                    result[var_name].append('To('+a_ass_str+', '+b_ass_str+')')
                elif str(var_type) in x:
                    string_of_type_ass = str(x[str(var_type)])
                    result[var_name].append(string_of_type_ass)
                    if string_of_type_ass == str(JSTy.Comp(JSTy.Ok)):
                        any_fails.append(i)   
                else:
                    result[var_name].append('Unknown')
                j += 1
            i += 1

        #for top in result:
        #    result[top] = uniques_in_list(result[top])
        return {
            'ass' : result,
            'fails_at': any_fails
        }
        #list(map(lambda x: if str(term_type) in x: str(x[str(term_type)]), xs))
    
    #print(env)
    assigns_and_fails = term_ass(solns)
    term_type_assignments = assigns_and_fails['ass']
    fails_at = assigns_and_fails['fails_at']

    #all_term_type_assignments = term_ass(all_solns)
    #just take the uniques 
    #unique_all_term_type_ass = uniques_in_list(all_term_type_assignments)
    #unique_term_type_ass = uniques_in_list(term_type_assignments)
    #unique_top_type_ass = uniques_in_list(top_type_assignments)
    
    reply = {
        #'top': str(Or(list(map(lambda x: unpack(x, type_lookup, JSTy), top_type['xs'])))),
        #'constrs': str(all_and_show_me_false),#show_constrs(all_and_show_me_false),
        'sol': solns_to_strs(solns),
        #'sol_conj': show_constrs(list(map(lambda x: soln_to_constrs(x, type_lookup), solns))),
        #'type_vars': type_list,
        'term_type_assignments': term_type_assignments,
        'fails_at': uniques_in_list(fails_at)
        #'top_term_assignments': unique_top_type_ass,
        #'term_type_assignments_all': unique_all_term_type_ass,
        #'bound_in_top': bound_in_top
    }
    print(reply) #test to see if we can send the constraints back


if __name__ == '__main__':
    main()
