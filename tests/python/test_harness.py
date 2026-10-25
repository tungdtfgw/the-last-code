"""Unit tests for src/engine/python/harness.py (run with `npm run test:py`)."""

import json
import os
import sys
import time
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "src", "engine", "python"))

from harness import run_level  # noqa: E402

with open(os.path.join(ROOT, "src", "levels", "level-1-4.json"), encoding="utf-8") as fh:
    LEVEL = json.load(fh)

CONFIG = json.dumps(
    {
        "inputs": LEVEL["inputs"],
        "objectives": [{"var": o["var"], "type": o["type"]} for o in LEVEL["objectives"]],
        "tests": LEVEL["tests"],
        "counter_attack_tests": LEVEL["counter_attack_tests"],
        "float_abs_tolerance": LEVEL["float_abs_tolerance"],
        "counter_line_count_cap": 20,
        "limits": {
            "max_line_events": 100000,
            "max_stdout_chars": 8000,
            "max_stdout_lines": 200,
            "preview_chars": 80,
        },
    }
)

HEADER = '# Dữ liệu đọc từ chip (KHÔNG được sửa 3 dòng này)\ntuoi = "27"\nchieu_cao = "1.72"\ncap_do = "3"\n'
STARTER = LEVEL["starter_code"]


def blank_locked(src, locked=(2, 3, 4)):
    lines = src.replace("\r\n", "\n").split("\n")
    for n in locked:
        lines[n - 1] = ""
    return "\n".join(lines)


def run(body, header=HEADER):
    """`body` starts at editor line 5 (after the 4-line header)."""
    return json.loads(run_level(CONFIG, blank_locked(header + body)))


def base(report, i=0):
    return report["base_results"][i]


def counter(report, i=0):
    return report["counter_results"][i]


SOLUTION_66 = (
    "\n"
    "ma_xac_thuc = int(tuoi) * 100 + int(cap_do)\n"
    "chi_so = round(float(chieu_cao) * 2, 2)\n"
    "hop_le = True\n"
)
# Line 5 blank, line 6 = ma_xac_thuc ... so the ValueError line is 6 here.
SOLUTION_67 = (
    "\n"
    "ma_xac_thuc = int(float(tuoi)) * 100 + int(float(cap_do))\n"
    "chi_so = round(float(chieu_cao) * 2, 2)\n"
    "hop_le = True\n"
)


def starter_with(line7):
    lines = STARTER.split("\n")
    lines[6] = line7
    return "\n".join(lines)


class OriginalCode(unittest.TestCase):
    def test_original_runs_without_error_and_is_wrong_type(self):
        r = json.loads(run_level(CONFIG, blank_locked(STARTER)))
        self.assertIsNone(r["compile_error"])
        b = base(r)
        self.assertEqual(b["status"], "ok")
        self.assertIsNone(b["error"])
        ma = b["vars"]["ma_xac_thuc"]
        self.assertEqual(ma["type"], "str")
        self.assertEqual(ma["length"], 201)
        self.assertLessEqual(len(ma["preview"]), 81)
        for v in b["vars"].values():
            self.assertFalse(v["type_ok"])
        self.assertIsNone(r["counter_results"])

    def test_typeerror_on_line_7(self):
        r = json.loads(
            run_level(CONFIG, blank_locked(starter_with("ma_xac_thuc = int(tuoi) * 100 + cap_do")))
        )
        b = base(r)
        self.assertEqual(b["status"], "runtime_error")
        self.assertEqual(b["error"]["type"], "TypeError")
        self.assertEqual(b["error"]["line"], 7)
        self.assertEqual(b["error"]["traceback_lines"][-1]["line"], 7)
        self.assertIn("ma_xac_thuc", b["error"]["traceback_lines"][-1]["text"])


class Solutions(unittest.TestCase):
    def test_two_star_solution(self):
        r = run(SOLUTION_66)
        b = base(r)
        self.assertEqual(b["status"], "ok")
        self.assertTrue(all(v["type_ok"] and v["value_ok"] for v in b["vars"].values()))
        self.assertEqual(b["line_count"], 3)
        c = counter(r)
        self.assertEqual(c["status"], "runtime_error")
        self.assertEqual(c["error"]["type"], "ValueError")
        self.assertEqual(c["error"]["line"], 6)

    def test_two_star_solution_editor_line_7(self):
        src = starter_with("ma_xac_thuc = int(tuoi) * 100 + int(cap_do)")
        src = src.replace("chi_so = chieu_cao * 2", "chi_so = round(float(chieu_cao) * 2, 2)")
        src = src.replace('hop_le = "True"', "hop_le = True")
        r = json.loads(run_level(CONFIG, blank_locked(src)))
        self.assertEqual(base(r)["line_count"], 3)
        self.assertEqual(counter(r)["error"]["line"], 7)

    def test_three_star_solution(self):
        r = run(SOLUTION_67)
        self.assertEqual(base(r)["status"], "ok")
        c = counter(r)
        self.assertEqual(c["status"], "ok")
        self.assertTrue(all(v["type_ok"] and v["value_ok"] for v in c["vars"].values()))

    def test_hardcoded_fails_counter_value(self):
        r = run("ma_xac_thuc = 2703\nchi_so = 3.44\nhop_le = True\n")
        self.assertTrue(base(r)["vars"]["ma_xac_thuc"]["value_ok"])
        c = counter(r)
        self.assertEqual(c["status"], "ok")
        self.assertTrue(c["vars"]["ma_xac_thuc"]["type_ok"])
        self.assertFalse(c["vars"]["ma_xac_thuc"]["value_ok"])

    def test_reassigning_inputs_is_hardcoding(self):
        r = run(
            'tuoi = "27"\ncap_do = "3"\nchieu_cao = "1.72"\n'
            "ma_xac_thuc = int(tuoi) * 100 + int(cap_do)\n"
            "chi_so = round(float(chieu_cao) * 2, 2)\nhop_le = True\n"
        )
        self.assertEqual(base(r)["status"], "ok")
        self.assertFalse(counter(r)["vars"]["ma_xac_thuc"]["value_ok"])

    def test_counter_not_run_when_sentinel_catches(self):
        body = "x = 0\n" * 18 + SOLUTION_67
        r = run(body)
        self.assertEqual(base(r)["line_count"], 21)
        self.assertIsNone(r["counter_results"])
        r = run("x = 0\n" * 17 + SOLUTION_67)
        self.assertEqual(base(r)["line_count"], 20)
        self.assertIsNotNone(r["counter_results"])

    def test_phases_base_then_counter(self):
        src = blank_locked(HEADER + SOLUTION_67)
        b = json.loads(run_level(CONFIG, src, "base"))
        self.assertTrue(b["counter_pending"])
        self.assertIsNone(b["counter_results"])
        self.assertEqual(b["base_results"][0]["status"], "ok")
        c = json.loads(run_level(CONFIG, src, "counter"))
        self.assertEqual(c["base_results"], [])
        self.assertEqual(c["counter_results"][0]["status"], "ok")
        failing = json.loads(run_level(CONFIG, blank_locked(STARTER), "base"))
        self.assertFalse(failing["counter_pending"])

    def test_namespaces_are_fresh_per_test(self):
        # A variable created in the base run must not leak into the counter run.
        r = run(
            "try:\n    seen\n    leaked = True\nexcept NameError:\n    leaked = False\nseen = 1\n"
            "ma_xac_thuc = int(float(tuoi)) * 100 + int(float(cap_do))\n"
            "chi_so = round(float(chieu_cao) * 2, 2)\nhop_le = not leaked\n"
        )
        self.assertTrue(counter(r)["vars"]["hop_le"]["value_ok"])


class Types(unittest.TestCase):
    def test_float_shape_matches_value(self):
        r = run(
            "ma_xac_thuc = float(tuoi) * 100 + float(cap_do)\n"
            "chi_so = round(float(chieu_cao) * 2, 2)\nhop_le = True\n"
        )
        v = base(r)["vars"]["ma_xac_thuc"]
        self.assertEqual(v["type"], "float")
        self.assertFalse(v["type_ok"])
        self.assertTrue(v["value_match_other_type"])

    def test_string_number_matches_value(self):
        r = run('ma_xac_thuc = "2703"\nchi_so = 3.44\nhop_le = "True"\n')
        b = base(r)
        self.assertTrue(b["vars"]["ma_xac_thuc"]["value_match_other_type"])
        self.assertTrue(b["vars"]["hop_le"]["value_match_other_type"])

    def test_bool_is_not_int_and_int_is_not_bool(self):
        r = run("ma_xac_thuc = True\nchi_so = 3.44\nhop_le = 1\n")
        b = base(r)
        self.assertFalse(b["vars"]["ma_xac_thuc"]["type_ok"])
        self.assertFalse(b["vars"]["ma_xac_thuc"]["value_match_other_type"])
        self.assertFalse(b["vars"]["hop_le"]["type_ok"])

    def test_float_tolerance(self):
        r = run("ma_xac_thuc = 2703\nchi_so = float(chieu_cao) * 2\nhop_le = True\n")
        self.assertTrue(base(r)["vars"]["chi_so"]["value_ok"])
        r = run("ma_xac_thuc = 2703\nchi_so = round(float(chieu_cao) * 2, 1)\nhop_le = True\n")
        self.assertTrue(base(r)["vars"]["chi_so"]["type_ok"])
        self.assertFalse(base(r)["vars"]["chi_so"]["value_ok"])
        for bad in ('float("nan")', 'float("inf")'):
            r = run("ma_xac_thuc = 2703\nchi_so = " + bad + "\nhop_le = True\n")
            self.assertFalse(base(r)["vars"]["chi_so"]["value_ok"])

    def test_shadowed_builtin_types_do_not_fool_grader(self):
        r = run("int = float\nma_xac_thuc = int(tuoi) * 100\nchi_so = 3.44\nhop_le = True\n")
        self.assertFalse(base(r)["vars"]["ma_xac_thuc"]["type_ok"])
        r = run(
            "class int(int):\n    pass\n"
            "ma_xac_thuc = int(2703)\nchi_so = 3.44\nhop_le = True\n"
        )
        v = base(r)["vars"]["ma_xac_thuc"]
        self.assertFalse(v["type_ok"])
        self.assertEqual(v["type"], "int")
        self.assertEqual(v["preview"], "<int>")

    def test_player_repr_is_never_called(self):
        r = run(
            "class X:\n    def __repr__(self):\n        while True:\n            pass\n"
            "ma_xac_thuc = X()\nchi_so = 3.44\nhop_le = True\n"
        )
        self.assertEqual(base(r)["vars"]["ma_xac_thuc"]["preview"], "<X>")


class Missing(unittest.TestCase):
    def test_missing_variable(self):
        r = run("ma_xac_thuc = 2703\nchi_so = 3.44\n")
        self.assertFalse(base(r)["vars"]["hop_le"]["present"])
        self.assertTrue(base(r)["vars"]["chi_so"]["present"])

    def test_empty_code(self):
        r = run("")
        self.assertEqual(base(r)["status"], "ok")
        self.assertFalse(any(v["present"] for v in base(r)["vars"].values()))

    def test_swallowed_error_grades_final_state(self):
        r = run("try:\n    ma_xac_thuc = int(chieu_cao)\nexcept ValueError:\n    pass\nchi_so = 3.44\nhop_le = True\n")
        self.assertEqual(base(r)["status"], "ok")
        self.assertFalse(base(r)["vars"]["ma_xac_thuc"]["present"])


class Errors(unittest.TestCase):
    def assertRuntime(self, body, err_type, line):
        b = base(run(body))
        self.assertEqual(b["status"], "runtime_error", b)
        self.assertEqual(b["error"]["type"], err_type)
        self.assertEqual(b["error"]["line"], line)

    def test_value_error(self):
        self.assertRuntime("\n\nx = int(chieu_cao)\n", "ValueError", 7)

    def test_zero_division(self):
        self.assertRuntime("x = 1 / 0\n", "ZeroDivisionError", 5)

    def test_attribute_error(self):
        self.assertRuntime("x = tuoi.to_int()\n", "AttributeError", 5)

    def test_name_error(self):
        self.assertRuntime("x = tuoii\n", "NameError", 5)

    def test_removed_builtins_are_name_errors(self):
        for call in ("exit()", "quit()", "help()"):
            self.assertRuntime(call + "\n", "NameError", 5)

    def test_other_errors_keep_type(self):
        self.assertRuntime("x = [][1]\n", "IndexError", 5)
        self.assertRuntime("x = {}['a']\n", "KeyError", 5)

    def test_error_inside_player_function_reports_deepest_line(self):
        b = base(run("def f():\n    return 1 / 0\n\nx = f()\n"))
        self.assertEqual(b["error"]["line"], 6)
        self.assertEqual([t["line"] for t in b["error"]["traceback_lines"]], [8, 6])

    def test_syntax_error(self):
        r = run("\n\nx = (1 +\n")
        self.assertEqual(r["compile_error"]["type"], "SyntaxError")
        self.assertEqual(r["base_results"], [])
        r = run("x == = 3\n")
        self.assertEqual(r["compile_error"]["line"], 5)

    def test_indentation_errors(self):
        r = run("if True:\nx = 1\n")
        self.assertEqual(r["compile_error"]["type"], "IndentationError")
        self.assertEqual(r["compile_error"]["line"], 6)
        r = run("if True:\n        x = 1\n\ty = 2\n")
        self.assertIn(r["compile_error"]["type"], ("TabError", "IndentationError"))

    def test_null_byte_source(self):
        r = run("x = 1\x00\n")
        self.assertIsNotNone(r["compile_error"])

    def test_recursion_is_resource_limit(self):
        b = base(run("def f():\n    return f()\nf()\n"))
        self.assertEqual(b["status"], "resource_limit")

    def test_huge_string_is_resource_limit(self):
        # In the browser (wasm32) "x" * 10**10 overflows the index size. On a 64-bit
        # host that would try to allocate 10 GB, so use sizes that fail fast here:
        # 10**18 → MemoryError, 10**19 → OverflowError (same harness branch).
        size = "10**10" if sys.maxsize < 2**32 else "10**18"
        self.assertEqual(base(run('x = "x" * ' + size + "\n"))["status"], "resource_limit")
        self.assertEqual(base(run('x = "x" * 10**19\n'))["status"], "resource_limit")

    def test_huge_int_preview_does_not_crash(self):
        b = base(run("x = 10**5000\nma_xac_thuc = x\n"))
        self.assertEqual(b["status"], "ok")
        self.assertEqual(b["vars"]["ma_xac_thuc"]["preview"], "<không hiển thị được>")

    def test_large_string_preview_is_truncated(self):
        b = base(run('ma_xac_thuc = "x" * 10**6\n'))
        v = b["vars"]["ma_xac_thuc"]
        self.assertEqual(v["length"], 10**6)
        self.assertLessEqual(len(v["preview"]), 81)


class Sandbox(unittest.TestCase):
    def test_blocked_imports(self):
        for stmt in ("import js", "import os", "from pyodide import ffi", '__import__("sys")',
                     "import os.path", "import micropip", "from pyodide.ffi import to_js"):
            b = base(run(stmt + "\n"))
            self.assertEqual(b["status"], "blocked_import", stmt)
            self.assertEqual(b["error"]["line"], 5)

    def test_allowed_import(self):
        b = base(run("import math\nx = math.floor(2.5)\n"))
        self.assertEqual(b["status"], "ok")

    def test_input_unsupported(self):
        self.assertEqual(base(run("x = input()\n"))["status"], "input_unsupported")

    def test_system_exit(self):
        self.assertEqual(base(run("raise SystemExit\n"))["status"], "system_exit")

    def test_infinite_loop_times_out_fast(self):
        start = time.monotonic()
        b = base(run("while True:\n    pass\n"))
        self.assertEqual(b["status"], "timeout")
        self.assertLess(time.monotonic() - start, 2.0)

    def test_infinite_loop_inside_except_exception_times_out(self):
        b = base(run("try:\n    while True:\n        pass\nexcept Exception:\n    pass\n"))
        self.assertEqual(b["status"], "timeout")

    def test_bare_except_cannot_hide_budget(self):
        b = base(run("try:\n    while True:\n        pass\nexcept:\n    pass\nma_xac_thuc = 1\n"))
        self.assertEqual(b["status"], "timeout")

    def assertFastTimeout(self, body):
        start = time.monotonic()
        b = base(run(body))
        elapsed = time.monotonic() - start
        self.assertEqual(b["status"], "timeout", body)
        self.assertLess(elapsed, 1.0, body)

    def test_bare_except_in_outer_loop_is_cut_by_budget(self):
        self.assertFastTimeout("while True:\n    try:\n        while True:\n            pass\n    except:\n        pass\n")

    def test_except_base_exception_in_outer_loop(self):
        self.assertFastTimeout(
            "while True:\n    try:\n        while True:\n            pass\n    except BaseException as e:\n        x = e\n"
        )

    def test_nested_try_finally_loops(self):
        self.assertFastTimeout(
            "while True:\n    try:\n        try:\n            while True:\n                pass\n"
            "        finally:\n            for i in range(10**9):\n                pass\n"
            "    except:\n        continue\n"
        )

    def test_finally_continue_cannot_swallow(self):
        self.assertFastTimeout("while True:\n    try:\n        while True:\n            pass\n    finally:\n        continue\n")

    def test_suppress_then_infinite_comprehension(self):
        self.assertFastTimeout(
            "import contextlib\nwith contextlib.suppress(BaseException):\n    while True:\n        pass\n"
            "x = [0 for _ in iter(int, 1)]\n"
        )

    def test_generator_loops_and_swallowing_generator(self):
        self.assertFastTimeout(
            "def g():\n    while True:\n        try:\n            yield 1\n        except BaseException:\n            pass\n"
            "while True:\n    try:\n        for v in g():\n            pass\n    except:\n        pass\n"
        )
        self.assertFastTimeout("while True:\n    try:\n        sum(1 for _ in iter(int, 1))\n    except:\n        pass\n")

    def test_guard_is_unreachable_and_does_not_change_counts_or_lines(self):
        # No guard name exists in the player's namespace or builtins.
        r = run(
            "names = sorted(k for k in globals() if 'guard' in k.lower())\n"
            "bnames = sorted(k for k in __builtins__ if 'guard' in str(k).lower())\n"
            "print(names, bnames)\n"
        )
        self.assertEqual(base(r)["stdout"], "[] []\n")
        r = run("for i in range(3):\n    x = 1 / (i - 2)\n")
        self.assertEqual(base(r)["error"]["line"], 6)
        self.assertEqual(base(run(SOLUTION_67))["line_count"], 3)

    def test_normal_try_except_and_comprehensions_still_work(self):
        r = run(
            "try:\n    ma_xac_thuc = int(tuoi)\nexcept ValueError:\n    ma_xac_thuc = 0\nfinally:\n    z = 1\n"
            "chi_so = round(float(chieu_cao) * 2, 2)\n"
            "hop_le = all([c.isdigit() for c in tuoi if c])\n"
        )
        self.assertEqual(base(r)["status"], "ok")
        self.assertTrue(base(r)["vars"]["hop_le"]["value_ok"])
        self.assertEqual(base(r)["vars"]["ma_xac_thuc"]["preview"], "27")

    def test_print_flood_is_capped(self):
        b = base(run("for i in range(10**6):\n    print(i)\n"))
        self.assertIn(b["status"], ("timeout", "ok"))
        self.assertLessEqual(len(b["stdout"]), 8000)
        self.assertTrue(b["stdout_truncated"])
        self.assertLessEqual(b["stdout"].count("\n"), 200)

    def test_long_single_print_is_capped(self):
        b = base(run('print("y" * 20000)\n'))
        self.assertEqual(b["status"], "ok")
        self.assertEqual(len(b["stdout"]), 8000)
        self.assertTrue(b["stdout_truncated"])

    def test_small_print_kept(self):
        b = base(run('print("xin chào", 1)\n'))
        self.assertEqual(b["stdout"], "xin chào 1\n")
        self.assertFalse(b["stdout_truncated"])

    def test_unicode_and_crlf(self):
        src = blank_locked(STARTER).replace("\n", "\r\n") + "# ghi chú tiếng Việt: đường\r\n"
        r = json.loads(run_level(CONFIG, src))
        self.assertEqual(base(r)["vars"]["ma_xac_thuc"]["length"], 201)

    def test_statement_count_excludes_locked_and_comments(self):
        r = run("# chú thích\nma_xac_thuc = 1\n\nchi_so = 2.0\n")
        self.assertEqual(base(r)["line_count"], 2)

    def test_wrapped_statements_count_once(self):
        r = run(
            "ma_xac_thuc = (\n    int(float(tuoi)) * 100\n    + int(float(cap_do))\n)\n"
            "chi_so = round(\n    float(chieu_cao) * 2,\n    2,\n)\n"
            "hop_le = (\n    True\n)\n"
        )
        self.assertEqual(base(r)["line_count"], 3)
        self.assertEqual(counter(r)["status"], "ok")
        self.assertEqual(base(run("x = int(\n    tuoi\n)\n"))["line_count"], 1)

    def test_one_line_loop_counts_each_pass(self):
        self.assertGreaterEqual(base(run("for i in range(5): pass\n"))["line_count"], 5)

    def test_recursion_traceback_is_capped(self):
        b = base(run("def f(n):\n    return f(n + 1)\nf(0)\n"))
        self.assertEqual(b["status"], "resource_limit")
        self.assertLessEqual(len(b["error"]["traceback_lines"]), 6)
        self.assertGreater(b["error"]["traceback_omitted"], 0)

    def test_patching_shared_modules_does_not_break_later_runs(self):
        import json as j
        import math as m

        saved = (m.isfinite, j.dumps, j.loads)
        try:
            patch = "import math\nimport json\nmath.isfinite = None\njson.dumps = None\njson.loads = None\n"
            run_level(CONFIG, blank_locked(HEADER + patch))  # harness must not depend on the patched modules
            m.isfinite, j.dumps, j.loads = saved  # the test itself needs json again
            patch_again = "import math\nmath.isfinite = None\n"
            run_level(CONFIG, blank_locked(HEADER + patch_again))
            r = run(SOLUTION_67)
            self.assertEqual(base(r)["status"], "ok")
            self.assertEqual(counter(r)["status"], "ok")
            self.assertTrue(counter(r)["vars"]["chi_so"]["value_ok"])
        finally:
            m.isfinite, j.dumps, j.loads = saved

    def test_internal_error_names_are_public(self):
        self.assertEqual(base(run("import os\n"))["error"]["type"], "ImportError")
        self.assertEqual(base(run("x = input()\n"))["error"]["type"], "RuntimeError")

    def test_loop_counts_each_iteration(self):
        r = run("for i in range(5):\n    pass\n")
        self.assertGreaterEqual(base(r)["line_count"], 10)


if __name__ == "__main__":
    unittest.main()
