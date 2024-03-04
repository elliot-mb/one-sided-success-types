import argparse
import json

parser = argparse.ArgumentParser(description = 'z3 interface')
parser.add_argument('-constraints', '-c', type=str, default=None)
args = parser.parse_args()

def main():
    constrs = json.loads(args.constraints)

    print(constrs)

if __name__ == '__main__':
    main()
