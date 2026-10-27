"""Grading harness for player code (pure stdlib: runs in Pyodide and in local CPython).

Entry point: ``run_level(config_json, source) -> str`` (a JSON document).

Threat model
------------
This is a single-player game that runs on the player's own machine. The worker
that hosts Pyodide has no DOM, no ``localStorage`` and no secrets. The real risks
are (a) the player hanging their own tab and (b) the player cheating their own
star rating. Blocking imports, removing ``exit``, replacing ``input`` and counting line
events are guard rails against accidental mistakes and easy cheating, not an
absolute sandbox: a determined player can still escape through
``().__class__.__subclasses__()`` and similar tricks. They only fool themselves.
Any future shared leaderboard must re-grade on a server.

Line numbers
------------
The caller replaces the locked input lines with empty lines before calling us,
so line numbers in tracebacks match the editor and locked lines are never
counted as statements. Inputs are injected into the namespace instead.
"""

import ast
import builtins as _builtins_module
import gc
import json
import math
import sys
import unicodedata
import warnings

# Private references: player code may import and patch `math`, `json`, `ast` or `unicodedata`
# (they are shared module objects), which must not change how later runs are graded.
_isfinite = math.isfinite
_normalize = unicodedata.normalize
_json_dumps = json.dumps
_json_loads = json.loads
_ast_parse = ast.parse
_ast_walk = ast.walk
_ast_stmt = ast.stmt
_ast_copy_location = ast.copy_location
_ast_fix = ast.fix_missing_locations
_CodeType = type(compile("0", "<x>", "eval"))

PLAYER_FILENAME = "<player>"

# Captured before any player code runs, so `int = float` or `class int(int)`
# inside player code cannot change how we grade.
TYPE_MAP = {"int": int, "float": float, "str": str, "bool": bool}
_PRIMITIVE_TYPES = (int, float, str, bool, type(None), complex, bytes)
_type = type
_type_type = type  # the shape of shapes: `type(int) is type` (objectives of type "type")
_len = len
_str_of = str.__str__  # exact str of a str (subclass), never dispatches to a player __str__
_class_name = _type_type.__dict__["__name__"]
_class_module = _type_type.__dict__["__module__"]
_repr = repr
_isinstance = isinstance

BLOCKED_MODULES = frozenset(
    {
        "js",
        "pyodide",
        "pyodide_js",
        "_pyodide",
        "micropip",
        "sys",
        "os",
        "subprocess",
        "ctypes",
        "importlib",
        "builtins",
        "gc",
        "inspect",
        "threading",
        "signal",
        "pyodide_http",
    }
)
REMOVED_BUILTINS = ("exit", "quit", "help", "breakpoint", "copyright", "credits", "license")

DEFAULT_LIMITS = {
    "max_line_events": 100000,
    "max_stdout_chars": 8000,
    "max_stdout_lines": 200,
    "preview_chars": 80,
    "message_chars": 300,
    "var_history_max": 40,
}

UNPRINTABLE = "<không hiển thị được>"


class _LineBudgetExceeded(BaseException):
    """BaseException so that `except Exception:` in player code cannot swallow it."""


class _BlockedImport(ImportError):
    pass


class _InputUnsupported(RuntimeError):
    pass


# ---------------------------------------------------------------------------
# Loop guard
#
# CPython drops the trace function as soon as it raises, so after the line budget
# fires a player `except:` / `except BaseException:` / `finally:` / contextlib.suppress
# can swallow the budget exception and keep looping untraced. To keep the fast budget
# authoritative, the player's AST gets a guard call at the start of every loop body,
# every `except` handler and every `finally` block, and in every comprehension
# filter. The guard re-raises the budget exception once the budget is exhausted.
#
# The call is compiled as a call to a unique string constant which is then swapped
# for the guard function inside the code objects' constants. There is no name the
# player can look up, rebind or delete; the guard shares the line number of the
# statement it precedes, so line numbers and statement counts are unchanged.
# ---------------------------------------------------------------------------

_GUARD_SENTINEL = "\x00the-last-code:loop-guard\x00"
_budget = {"hit": False}


def _loop_guard():
    if _budget["hit"]:
        raise _LineBudgetExceeded()
    return True


class _GuardInjector(ast.NodeTransformer):
    @staticmethod
    def _call(anchor):
        call = ast.Call(func=ast.Constant(_GUARD_SENTINEL), args=[], keywords=[])
        _ast_copy_location(call.func, anchor)
        return _ast_copy_location(call, anchor)

    def _guarded(self, body):
        if not body:
            return body
        stmt = ast.Expr(self._call(body[0]))
        return [_ast_copy_location(stmt, body[0])] + body

    def _loop(self, node):
        self.generic_visit(node)
        node.body = self._guarded(node.body)
        return node

    visit_For = visit_AsyncFor = visit_While = _loop

    def visit_ExceptHandler(self, node):
        self.generic_visit(node)
        node.body = self._guarded(node.body)
        return node

    def _try(self, node):
        self.generic_visit(node)
        node.finalbody = self._guarded(node.finalbody)
        return node

    visit_Try = _try
    if hasattr(ast, "TryStar"):
        visit_TryStar = _try

    def visit_comprehension(self, node):
        self.generic_visit(node)
        node.ifs = [self._call(node.iter)] + list(node.ifs)
        return node


def _swap_guard(code):
    consts = []
    for c in code.co_consts:
        if _type(c) is _CodeType:
            c = _swap_guard(c)
        elif _type(c) is str and c == _GUARD_SENTINEL:
            c = _loop_guard
        consts.append(c)
    return code.replace(co_consts=tuple(consts))


def _compile_guarded(source):
    """Compile player code with loop guards; same filename and line numbers as `source`."""
    tree = _GuardInjector().visit(_ast_parse(source, PLAYER_FILENAME))
    _ast_fix(tree)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")  # "'str' object is not callable" for the sentinel call
        code = compile(tree, PLAYER_FILENAME, "exec", dont_inherit=True)
    return _swap_guard(code)


_original_import = _builtins_module.__import__


def _guarded_import(name, globals=None, locals=None, fromlist=(), level=0):
    root = str(name).split(".")[0]
    if level == 0 and root in BLOCKED_MODULES:
        raise _BlockedImport("Mô-đun bị phong tỏa: " + root)
    return _original_import(name, globals, locals, fromlist, level)


def _no_input(*_args, **_kwargs):
    raise _InputUnsupported("Không có kênh nhập liệu")


# The station's channel holds at most this many prompts per run (each clipped to preview_chars).
MAX_PROMPTS = 20


def _stdin_input(lines, out, state, preview_chars):
    """`input()` of a level with a stdin channel: reads `lines` in order, like CPython with piped stdin.

    The prompt goes to the (captured) stdout without a newline and is graded like any output;
    the line read is returned exactly as given. Past the last line: EOFError, CPython's message.
    """

    def input(prompt=""):  # noqa: A001 - the player's builtin
        text = str(prompt)  # errors (a player __str__) propagate as in CPython
        if text:
            out.write(text)
            if _len(state["prompts"]) < MAX_PROMPTS:
                state["prompts"].append(_clip(text, preview_chars))
        if state["read"] >= _len(lines):
            raise EOFError("EOF when reading a line")
        line = lines[state["read"]]
        state["read"] += 1
        return line

    return input


def _make_builtins():
    safe = dict(_builtins_module.__dict__)
    for name in REMOVED_BUILTINS:
        safe.pop(name, None)
    safe["__import__"] = _guarded_import
    safe["input"] = _no_input
    return safe


class _CappedWriter:
    """File-like sink that keeps at most N chars / N lines and never raises."""

    def __init__(self, max_chars, max_lines):
        self.max_chars = max_chars
        self.max_lines = max_lines
        self.parts = []
        self.chars = 0
        self.lines = 0
        self.truncated = False

    def write(self, text):
        if not _isinstance(text, str):
            text = str(text)
        if self.truncated:
            return _len(text)
        room = self.max_chars - self.chars
        chunk = text[:room] if room > 0 else ""
        newline_room = self.max_lines - self.lines
        if chunk.count("\n") > newline_room:
            # Keep text up to and including the last allowed newline.
            idx = -1
            for _ in range(max(newline_room, 0)):
                idx = chunk.index("\n", idx + 1)
            chunk = chunk[: idx + 1]
            self.truncated = True
        if _len(chunk) < _len(text):
            self.truncated = True
        self.parts.append(chunk)
        self.chars += _len(chunk)
        self.lines += chunk.count("\n")
        return _len(text)

    def flush(self):
        pass

    def isatty(self):
        return False

    def getvalue(self):
        return "".join(self.parts)


def _safe_str(value, limit):
    try:
        text = str(value)
    except BaseException:  # noqa: BLE001 - player-controlled objects may raise anything
        return UNPRINTABLE
    return text if _len(text) <= limit else text[:limit] + "…"


def _name_of(cls, qualified=False):
    """A class's name without running player code (a `__name__` may be a str subclass).

    `qualified`: prefix the module for classes defined outside builtins, as Python
    prints them (`<class '__main__.int'>`), so a player class never passes for `int`.
    """
    try:
        name = _str_of(_class_name.__get__(cls))
        if qualified:
            module = _class_module.__get__(cls)
            if _type(module) is not str:
                module = _str_of(module) if _isinstance(module, str) else "?"
            if module != "builtins":
                name = module + "." + name
        return name
    except BaseException:  # noqa: BLE001
        return "?"


def _preview(value, limit):
    if _type(value) is _type_type:
        # A shape (`int`, a player class): shown as Python prints it, without calling repr.
        text = "<class '" + _name_of(value, qualified=True) + "'>"
        return text if _len(text) <= limit else text[:limit] + "…"
    if _type(value) not in _PRIMITIVE_TYPES:
        # Never run player-defined __repr__ (it could loop or raise).
        return "<" + _name_of(_type(value)) + ">"
    try:
        text = _repr(value)
    except BaseException:  # noqa: BLE001 - e.g. int with > 4300 digits
        return UNPRINTABLE
    return text if _len(text) <= limit else text[:limit] + "…"


def _values_equal(expected_type, value, expected, tol):
    if expected_type == "float":
        return _isfinite(value) and abs(value - float(expected)) <= tol
    if expected_type == "str":
        # NFC on both sides: the same text typed with combining marks is the same text.
        return _normalize("NFC", value) == _normalize("NFC", expected)
    return value == expected


def _value_match_other_type(value, expected_type, expected, tol):
    """When the type is wrong: does the value still mean the right thing?"""
    try:
        vt = _type(value)
        if expected_type == "bool":
            return vt is str and value.strip() == ("True" if expected else "False")
        if expected_type in ("int", "float"):
            if vt is bool:
                return False
            if vt in (int, float):
                number = float(value)
            elif vt is str:
                number = float(value.strip())
            else:
                return False
            return _isfinite(number) and abs(number - float(expected)) <= tol
        if expected_type == "str":
            return vt in (int, float) and str(value) == expected
        if expected_type == "type":
            # The shape's name written as text: "int" or "<class 'int'>".
            return vt is str and value.strip() in (expected, "<class '" + expected + "'>")
    except BaseException:  # noqa: BLE001
        return False
    return False


def _describe(ns, name, expected_type, expected, tol, preview_chars):
    if name not in ns:
        return {
            "present": False,
            "type": None,
            "preview": None,
            "length": None,
            "type_ok": False,
            "value_ok": False,
            "value_match_other_type": False,
        }
    value = ns[name]
    type_name = _name_of(_type(value))
    if expected_type == "type":
        # A shape itself, and exactly the expected one. TYPE_MAP was captured before player
        # code ran, so `int = 5` (or a player class named int) cannot pass as `int`.
        type_ok = _type(value) is _type_type
        value_ok = type_ok and value is TYPE_MAP.get(expected)
    else:
        type_ok = _type(value) is TYPE_MAP[expected_type]
        value_ok = False
    if type_ok and expected_type != "type":
        try:
            value_ok = bool(_values_equal(expected_type, value, expected, tol))
        except BaseException:  # noqa: BLE001
            value_ok = False
    return {
        "present": True,
        "type": type_name,
        "preview": _preview(value, preview_chars),
        "length": _len(value) if _type(value) is str else None,
        "type_ok": type_ok,
        "value_ok": value_ok,
        "value_match_other_type": (not type_ok)
        and _value_match_other_type(value, expected_type, expected, tol),
    }


def _player_frames(tb):
    frames = []
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == PLAYER_FILENAME:
            frames.append(tb.tb_lineno)
        tb = tb.tb_next
    return frames


def _source_line(lines, lineno):
    if lineno is None or lineno < 1 or lineno > _len(lines):
        return ""
    return lines[lineno - 1].strip()[:200]


# Harness-internal exception classes are reported under their public base names.
_PUBLIC_ERROR_NAMES = {"_BlockedImport": "ImportError", "_InputUnsupported": "RuntimeError"}
TRACEBACK_KEEP = 3


def _error_info(exc, lines, message_chars):
    linenos = _player_frames(exc.__traceback__)
    line = linenos[-1] if linenos else None
    omitted = 0
    if len(linenos) > 2 * TRACEBACK_KEEP:
        # Deep recursion: keep the outermost and innermost frames only.
        omitted = len(linenos) - 2 * TRACEBACK_KEEP
        linenos = linenos[:TRACEBACK_KEEP] + linenos[-TRACEBACK_KEEP:]
    name = _type(exc).__name__
    return {
        "type": _PUBLIC_ERROR_NAMES.get(name, name),
        "message": _safe_str(exc, message_chars),
        "line": line,
        "offset": None,
        "traceback_lines": [{"line": n, "text": _source_line(lines, n)} for n in linenos],
        "traceback_omitted": omitted,
    }


def _statement_lines(source):
    """First line of every statement: the alert bar counts statements, not wrapped lines."""
    try:
        return frozenset(n.lineno for n in _ast_walk(_ast_parse(source)) if isinstance(n, _ast_stmt))
    except BaseException:  # noqa: BLE001 - compile() already accepted the source
        return frozenset()


def _clip(text, limit):
    return text if _len(text) <= limit else text[:limit] + "…"


def _output_lines(text):
    """Graded form of stdout: newlines unified, NFC, trailing spaces and trailing empty lines dropped."""
    text = _normalize("NFC", text.replace("\r\n", "\n").replace("\r", "\n"))
    lines = [line.rstrip() for line in text.split("\n")]
    while lines and lines[-1] == "":
        lines.pop()
    return lines


def _first_difference(actual, expected):
    """1-based position of the first differing character (a prefix differs right after its end)."""
    for i in range(min(_len(actual), _len(expected))):
        if actual[i] != expected[i]:
            return i + 1
    return min(_len(actual), _len(expected)) + 1


def _grade_output(stdout, truncated, expected, preview_chars):
    """Line-by-line verdict of stdout against `expected` (a list of lines). Never raises."""
    try:
        actual = _output_lines(stdout)
        want = [_normalize("NFC", str(e)) for e in expected]
        verdicts = []
        for i, e in enumerate(want):
            if i >= _len(actual):
                verdicts.append(
                    {"line": i + 1, "expected": e, "actual": None, "status": "missing", "col": None, "case_only": False}
                )
                continue
            a = actual[i]
            ok = a == e
            verdicts.append(
                {
                    "line": i + 1,
                    "expected": e,
                    "actual": _clip(a, preview_chars),
                    "status": "ok" if ok else "wrong",
                    "col": None if ok else _first_difference(a, e),
                    "case_only": (not ok) and a.casefold() == e.casefold(),
                }
            )
        extra = actual[_len(want):]
        return {
            "ok": (not truncated) and not extra and all(v["status"] == "ok" for v in verdicts),
            "truncated": bool(truncated),
            "lines": verdicts,
            "extra_lines": [_clip(x, preview_chars) for x in extra[:3]],
            "extra_count": _len(extra),
        }
    except BaseException:  # noqa: BLE001 - a grading failure must not look like a player error
        return {"ok": False, "truncated": bool(truncated), "lines": [], "extra_lines": [], "extra_count": 0}


_MISSING = object()


class _VarHistory:
    """Assignment history of the objective variables, for the playback of the simulation.

    Compared by identity (`is`), previewed with `_preview`: no player `__eq__`/`__repr__`
    ever runs. `src` names the input whose original object (as loaded) the new value is,
    so a value typed by hand never counts as read from the buffer. Never raises.
    """

    def __init__(self, ns, watch, inputs, limit, preview_chars):
        self.ns = ns
        self.watch = watch
        self.seen = {n: ns.get(n, _MISSING) for n in watch}
        self.origin = tuple((n, ns[n]) for n in inputs if n in ns)
        self.limit = limit
        self.preview_chars = preview_chars
        self.entries = []
        self.full = False
        self.stmt_line = None

    def record(self):
        try:
            for n in self.watch:
                v = self.ns.get(n, _MISSING)
                if v is self.seen[n]:
                    continue
                if _len(self.entries) >= self.limit:
                    self.full = True
                    return
                self.seen[n] = v
                if v is _MISSING:
                    entry = {"line": self.stmt_line, "var": n, "type": None, "preview": None, "src": None}
                else:
                    type_name = _name_of(_type(v))
                    src = None
                    for name, obj in self.origin:
                        if obj is v:
                            src = name
                            break
                    entry = {
                        "line": self.stmt_line,
                        "var": n,
                        "type": type_name,
                        "preview": _preview(v, self.preview_chars),
                        "src": src,
                    }
                self.entries.append(entry)
        except BaseException:  # noqa: BLE001 - history is decoration; it must never break a run
            self.full = True


def _run_one(
    code, lines, stmt_lines, inputs, objectives, expected, tol, limits, expected_output=None, trace_vars=False, stdin=None
):
    ns = {"__builtins__": _make_builtins(), "__name__": "__main__"}
    ns.update(inputs)
    hist = (
        _VarHistory(ns, tuple(o["var"] for o in objectives), tuple(inputs), limits["var_history_max"], limits["preview_chars"])
        if trace_vars
        else None
    )
    out = _CappedWriter(limits["max_stdout_chars"], limits["max_stdout_lines"])
    # stderr has its own buffer: shown to the player, never graded.
    err = _CappedWriter(limits["max_stdout_chars"], limits["max_stdout_lines"])
    channel = None
    if stdin is not None:
        # A fresh builtins dict per run, so the channel never leaks into another test.
        channel = {"read": 0, "prompts": []}
        ns["__builtins__"]["input"] = _stdin_input(
            tuple(str(x) for x in stdin), out, channel, limits["preview_chars"]
        )
    budget = limits["max_line_events"]
    # `events` (every line event) drives the loop budget; `count` (statement starts) drives the alert bar.
    state = {"events": 0, "count": 0, "budget_hit": False}
    _budget["hit"] = False
    last_seen = {}

    # Note: CPython unsets the tracer after it raises. A bare `except:` around an
    # outer infinite loop therefore escapes the line budget; the worker's
    # wall-clock timeout is the second line of defence for that case.
    def local_tracer(frame, event, _arg):
        if event == "line":
            state["events"] += 1
            if state["events"] > budget:
                state["budget_hit"] = True
                _budget["hit"] = True
                raise _LineBudgetExceeded()
            lineno = frame.f_lineno
            if hist is not None and not hist.full:
                # Whatever changed was done by the statement that started last.
                hist.record()
                if lineno in stmt_lines:
                    hist.stmt_line = lineno
            if lineno in stmt_lines:
                lasti = frame.f_lasti
                prev = last_seen.get(frame)
                # Re-entering the same line counts again only after a backward jump
                # (a loop pass); returning to it mid-statement does not.
                if prev is None or prev[0] != lineno or lasti <= prev[1]:
                    state["count"] += 1
                last_seen[frame] = (lineno, lasti)
        return local_tracer

    def global_tracer(frame, _event, _arg):
        if frame.f_code.co_filename == PLAYER_FILENAME:
            return local_tracer
        return None

    status = "ok"
    error = None
    old_stdout, old_stderr = sys.stdout, sys.stderr
    old_limit = sys.getrecursionlimit()
    try:
        sys.stdout = out
        sys.stderr = err
        sys.setrecursionlimit(min(old_limit, 600))
        sys.settrace(global_tracer)
        try:
            exec(code, ns)
        finally:
            sys.settrace(None)
            _budget["hit"] = False
            sys.stdout, sys.stderr = old_stdout, old_stderr
            sys.setrecursionlimit(old_limit)
    except _LineBudgetExceeded:
        status = "timeout"
    except KeyboardInterrupt:
        status = "timeout"
    except _BlockedImport as exc:
        status = "blocked_import"
        error = _error_info(exc, lines, limits["message_chars"])
    except _InputUnsupported as exc:
        status = "input_unsupported"
        error = _error_info(exc, lines, limits["message_chars"])
    except SystemExit as exc:
        status = "system_exit"
        error = _error_info(exc, lines, limits["message_chars"])
    except (MemoryError, OverflowError, RecursionError) as exc:
        status = "resource_limit"
        error = _error_info(exc, lines, limits["message_chars"])
    except BaseException as exc:  # noqa: BLE001 - every player error is data
        status = "runtime_error"
        error = _error_info(exc, lines, limits["message_chars"])
    if hist is not None and not hist.full:
        hist.record()  # the last statement's assignment (also when it was followed by an error)
    if state["budget_hit"]:
        # The player may have swallowed the budget exception with a bare except.
        status = "timeout"
        error = None

    variables = {}
    for obj in objectives:
        variables[obj["var"]] = _describe(
            ns, obj["var"], obj["type"], expected.get(obj["var"]), tol, limits["preview_chars"]
        )
    result = {
        "status": status,
        "error": error,
        "line_count": state["count"],
        "stdout": out.getvalue(),
        "stdout_truncated": out.truncated,
        "stderr": err.getvalue(),
        "vars": variables,
        # Graded even when the run failed, so the simulation can show the lines that went out.
        "output": None
        if expected_output is None
        else _grade_output(out.getvalue(), out.truncated, expected_output, limits["preview_chars"]),
    }
    if channel is not None:
        result["stdin_read"] = channel["read"]
        result["prompts"] = channel["prompts"]
    if hist is not None:
        result["var_history"] = hist.entries
        result["var_history_truncated"] = hist.full
        hist.ns = hist.seen = hist.origin = None
    del ns
    last_seen.clear()
    gc.collect()
    return result


def _passed(result):
    return (
        result["status"] == "ok"
        and all(v["type_ok"] and v["value_ok"] for v in result["vars"].values())
        and (result["output"] is None or result["output"]["ok"])
    )


def run_level(config_json, source, phase="all"):
    """Grade `source`.

    phase "all": base tests, then counter-attack tests when the base passed.
    phase "base": base tests only; `counter_pending` says whether a counter phase should follow.
    phase "counter": counter-attack tests only (the caller runs it after a passing base phase,
    under its own time limit, so a counter-only hang cannot erase the base result).
    """
    config = _json_loads(config_json)
    limits = dict(DEFAULT_LIMITS)
    limits.update(config.get("limits") or {})
    objectives = config["objectives"]
    tol = float(config.get("float_abs_tolerance", 1e-9))
    trace_vars = bool(config.get("trace_vars"))
    source = str(source).replace("\r\n", "\n")
    lines = source.split("\n")
    report = {
        "python_version": sys.version.split()[0],
        "compile_error": None,
        "base_results": [],
        "counter_results": None,
        "counter_pending": False,
    }
    try:
        compile(source, PLAYER_FILENAME, "exec", dont_inherit=True)  # exact syntax errors
        code = _compile_guarded(source)
    except SyntaxError as exc:
        report["compile_error"] = {
            "type": _type(exc).__name__,
            "message": _safe_str(exc.msg, limits["message_chars"]),
            "line": exc.lineno,
            "offset": exc.offset,
            "text": _source_line(lines, exc.lineno),
        }
        return _json_dumps(report, ensure_ascii=False)
    except (ValueError, MemoryError, OverflowError, RecursionError) as exc:
        report["compile_error"] = {
            "type": _type(exc).__name__,
            "message": _safe_str(exc, limits["message_chars"]),
            "line": None,
            "offset": None,
            "text": "",
        }
        return _json_dumps(report, ensure_ascii=False)

    stmt_lines = _statement_lines(source)

    def run_suite(kind, tests):
        results = []
        for index, test in enumerate(tests):
            result = _run_one(
                code,
                lines,
                stmt_lines,
                test["inputs"],
                objectives,
                test["expected"],
                tol,
                limits,
                test.get("expected_output"),
                trace_vars,
                test.get("stdin"),
            )
            result["kind"] = kind
            result["index"] = index
            result["inputs"] = test["inputs"]
            results.append(result)
        return results

    counter_tests = config.get("counter_attack_tests") or []
    if phase == "counter":
        report["counter_results"] = run_suite("counter", counter_tests)
        return _json_dumps(report, ensure_ascii=False)

    report["base_results"] = run_suite("base", config["tests"])
    # Above 100% alert the Sentinel catches the player: no counter-attack is run.
    cap = config.get("counter_line_count_cap")
    caught = cap is not None and any(r["line_count"] > cap for r in report["base_results"])
    if not caught and all(_passed(r) for r in report["base_results"]):
        if phase == "base":
            report["counter_pending"] = len(counter_tests) > 0
            if not counter_tests:
                report["counter_results"] = []
        else:
            report["counter_results"] = run_suite("counter", counter_tests)
    return _json_dumps(report, ensure_ascii=False)
