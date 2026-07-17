# utils.py — Database utility helpers

import re
import sys

def sanitize_identifier(name: str) -> str:
    """Sanitize database object names (tables, columns) to avoid injection."""
    return re.sub(r"[^a-zA-Z0-9_]", "", name)

def safe_print(text: str, fallback_text: str = None) -> None:
    """Prints text, falling back to ASCII alternate on encoding errors (e.g. Windows CMD)."""
    try:
        # Try printing with default stdout encoding
        sys.stdout.write(text + "\n")
        sys.stdout.flush()
    except UnicodeEncodeError:
        if fallback_text is not None:
            sys.stdout.write(fallback_text + "\n")
        else:
            # Automatic fallback: strip non-ascii
            clean = text.encode("ascii", errors="replace").decode("ascii")
            sys.stdout.write(clean + "\n")
        sys.stdout.flush()

def print_step(step_name: str, status: str = "ok") -> None:
    """Print standard dashboard step statuses using safe platform-aware icons."""
    if status == "ok":
        safe_print(f"✓ {step_name}", f"[OK] {step_name}")
    elif status == "warn":
        safe_print(f"! {step_name}", f"[WARN] {step_name}")
    else:
        safe_print(f"✗ {step_name}", f"[FAIL] {step_name}")
