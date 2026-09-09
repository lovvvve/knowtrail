#!/usr/bin/env python3
"""Build the static Pages artifact and validate its internal links (stdlib only)."""

from html import escape, unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit
import os
import re
import shutil


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"
REPOSITORY = "https://github.com/lovvvve/knowtrail/blob/main/"
EXTENSIONS = {".html", ".css", ".js", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".ico", ".woff2", ".pdf", ".mp3", ".mp4"}


class PageLinks(HTMLParser):
    def __init__(self, content):
        super().__init__()
        self.links = []
        self.ids = set()
        self.feed(content)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])
        for key in ("href", "src"):
            if key in attrs:
                self.links.append(attrs[key])


def prepare_html(source, content):
    """Keep public teaching documentation on GitHub, and add a site return link."""
    def markdown_link(match):
        url = urlsplit(unescape(match.group(2)))
        if url.scheme or url.netloc or not url.path.endswith(".md"):
            return match.group(0)
        target = (source.parent / unquote(url.path)).resolve()
        if not target.is_file() or not target.is_relative_to(ROOT):
            raise ValueError(f"Invalid documentation link: {source}: {url.path}")
        link = REPOSITORY + quote(target.relative_to(ROOT).as_posix())
        if url.fragment:
            link += "#" + url.fragment
        return 'href="' + escape(link, quote=True) + '"'

    content = re.sub(r'href=([\"\'])([^\"\']+)\1', markdown_link, content)
    home = Path(os.path.relpath(ROOT / "index.html", source.parent)).as_posix()
    css = Path(os.path.relpath(ROOT / "assets/site.css", source.parent)).as_posix()
    content = content.replace("</head>", f'<link rel="stylesheet" href="{css}">\n</head>', 1)
    nav = f'\n<nav class="site-return" aria-label="站点导航"><a href="{home}">← 知径首页</a></nav>'
    return re.sub(r"<body\b[^>]*>", lambda match: match.group(0) + nav, content, count=1)


def build():
    if OUTPUT.is_symlink():
        raise ValueError("Refusing to replace a symlink at _site")
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    sources = [ROOT / "index.html"]
    sources.extend((ROOT / "assets").rglob("*"))
    for unit in sorted((ROOT / "content").glob("*/*")):
        for directory in ("lessons", "reference", "printable", "assets"):
            sources.extend((unit / directory).rglob("*"))
    for source in sources:
        if source.is_symlink() or not source.resolve().is_relative_to(ROOT):
            raise ValueError(f"Refusing to publish symlink: {source}")
        if not source.is_file() or source.suffix.lower() not in EXTENSIONS:
            continue
        destination = OUTPUT / source.relative_to(ROOT)
        destination.parent.mkdir(parents=True, exist_ok=True)
        if source.suffix == ".html" and source.parent != ROOT:
            destination.write_text(prepare_html(source, source.read_text(encoding="utf-8")), encoding="utf-8")
        else:
            shutil.copy2(source, destination)
    (OUTPUT / ".nojekyll").touch()


def validate():
    pages = {path: PageLinks(path.read_text(encoding="utf-8")) for path in OUTPUT.rglob("*.html")}
    references = [(path, link) for path, page in pages.items() for link in page.links]
    for path in OUTPUT.rglob("*.css"):
        references.extend((path, match.group(2).strip()) for match in re.finditer(
            r'url\(\s*([\"\']?)(.*?)\1\s*\)', path.read_text(encoding="utf-8")))
    for path, link in references:
        url = urlsplit(link)
        if url.scheme or url.netloc:
            continue
        if url.path.startswith("/"):
            raise ValueError(f"Root-relative link breaks project Pages paths: {path}: {link}")
        target = (path.parent / unquote(url.path)).resolve() if url.path else path
        if target.is_dir():
            target /= "index.html"
        if not target.is_relative_to(OUTPUT) or not target.is_file():
            raise ValueError(f"Missing published resource: {path.relative_to(OUTPUT)}: {link}")
        if url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            raise ValueError(f"Missing anchor: {path.relative_to(OUTPUT)}: {link}")
    print(f"Built {len(pages)} HTML pages; validated {len(references)} HTML/CSS links in {OUTPUT}")


if __name__ == "__main__":
    build()
    validate()
