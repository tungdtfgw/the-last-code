"""Read {"config": <config object or JSON string>, "source": str} from stdin, print run_level output."""

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "src", "engine", "python"))

from harness import run_level  # noqa: E402


def main():
    payload = json.loads(sys.stdin.read())
    config = payload["config"]
    config_json = config if isinstance(config, str) else json.dumps(config)
    sys.stdout.write(run_level(config_json, payload["source"], payload.get("phase", "all")))


if __name__ == "__main__":
    main()
