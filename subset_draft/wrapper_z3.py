import argparse

parser = argparse.ArgumentParser(description = 'z3 interface')
parser.add_argument('-constraints', '-c', type=str, default=None)
args = parser.parse_args()

print(args.constraints)
