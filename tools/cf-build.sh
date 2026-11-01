#!/usr/bin/env bash
# Збірка для Cloudflare Pages: у public/ кладемо лише файли сайту
# (без netlify.toml, функцій і службових файлів). Функції Cloudflare бере з functions/.
set -euo pipefail
rm -rf public
mkdir -p public
cp index.html 404.html robots.txt sitemap.xml public/
cp -R css js assets public/
find public -name '.DS_Store' -delete
