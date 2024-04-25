import argparse
import json
import pprint
from z3 import *

Simp = Datatype('NumFiddler')

Simp.declare('A')
Simp.declare('B')
Simp.declare('Actor', ('act', Simp))

Simp = Simp.create()

x = Simp.A
y = Simp.B

solver = Solver()
print(solver.help())