import argparse
import json
import pprint
from z3 import *

JSTy = Datatype('JSTy')

JSTy.declare('Num')
JSTy.declare('Ok')
JSTy.declare('To', ('lft', JSTy), ('rgt', JSTy))
# lft and rgt are always total
JSTy.declare('Comp', ('comp', JSTy))#C))
# comp is always total 

JSTy = JSTy.create()


x = Const('x', JSTy)
y = Const('y', JSTy)
const_lookup = {
    'x': x,
    'y': y,
}

solver = Solver()
solver.set(relevancy=1)
solver.add(Or(x == JSTy.Comp(JSTy.Ok), x == JSTy.To(y, y)))


solver.check()
while(solver.check() == sat):
    mod = solver.model()
    print(mod)
    mod_can_neg = []
    for ass in mod:
        neg = const_lookup[str(ass)] != mod[ass]
        #print(ass, mod[ass])
        mod_can_neg.append(neg)
    mod_negation_or = Or(mod_can_neg)
    print(mod_negation_or)
    solver.add(mod_negation_or)
