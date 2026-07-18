# migration_registry.py — Migration Registry
import importlib

MIGRATION_REGISTRY = {
    1: importlib.import_module("migrations.001_initial"),
    2: importlib.import_module("migrations.002_auth"),
    3: importlib.import_module("migrations.003_projects"),
    4: importlib.import_module("migrations.004_notifications"),
    5: importlib.import_module("migrations.005_workspace"),
    6: importlib.import_module("migrations.006_ml"),
    7: importlib.import_module("migrations.007_activity"),
    8: importlib.import_module("migrations.008_visualizations"),
    9: importlib.import_module("migrations.009_reports"),
    10: importlib.import_module("migrations.010_ai"),
    11: importlib.import_module("migrations.011_schema_repairs")
}
