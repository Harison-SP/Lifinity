import py_compile
import sys

try:
    py_compile.compile('app/routes/habit.py', doraise=True)
    print("Syntax OK")
except Exception as e:
    print(f"Syntax Error: {e}")
