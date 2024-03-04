import argparse
import json
from z3 import *

parser = argparse.ArgumentParser(description = 'z3 interface')
parser.add_argument('-constraints', '-c', type=str, default=None)
args = parser.parse_args()

def main():
    constrs = json.loads(args.constraints)
    reply = {
        'reflect': constrs,
        'sol': None
    }
    solver = Solver()
    JSTy = Datatype('JSTy')
    JSTy.declare('Num')
    JSTy.declare('Ok')
    JSTy.declare('Comp', ('val', JSTy))
    JSTy.declare('To', ('lft', JSTy), ('rgt', JSTy))
    JSTy = JSTy.create()
    a = Const('a', JSTy)
    b = Const('b', JSTy)
    c = Const('c', JSTy)
    
    #solve(b != JSTy.To(a, c))
    solver.add(Or(And(b == JSTy.To(a, c), (a == JSTy.Num)), (JSTy.Ok == b)))
    solver.check()
    mod = solver.model()
    reply['sol'] = list(map(lambda x: {str(x): str(mod[x])}, mod)) 
    print(reply) #test to see if we can send the constraints back

if __name__ == '__main__':
    main()
