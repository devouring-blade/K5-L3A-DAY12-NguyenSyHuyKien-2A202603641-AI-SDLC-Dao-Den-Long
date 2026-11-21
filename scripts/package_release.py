"""Package reviewed source + ready-to-run static build; never include credentials/tools."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
destination = root / "release" / "dao-den-long-v1.0.0-web.zip"
destination.parent.mkdir(parents=True, exist_ok=True)
names = ["dist", "src", "web", "scripts", "tests", "docs/notes", "docs/proof", "docs/demo", "docs/requirements", "docs/lab",
         "README.md", "AGENTS.md", "CHANGELOG.md", "CREDITS.md", "LICENSE",
         "package.json", "package-lock.json", "game.contract.json", "bench.json", "soak.json", "bench.png",
         "GUIDE.md", "RULES.md", "SUBMISSION.md", "RUBRIC.md", "CHECKPOINTS.md"]
with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name in names:
        base = root / name
        if not base.exists():
            raise FileNotFoundError(base)
        paths = base.rglob("*") if base.is_dir() else [base]
        for item in paths:
            if item.is_file() and "__pycache__" not in item.parts and item.suffix != ".webm":
                archive.write(item, "dao-den-long-v1.0.0/" + item.relative_to(root).as_posix())
print(destination)
