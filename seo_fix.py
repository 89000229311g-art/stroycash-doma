#!/usr/bin/env python3
"""SEO fix script for doma.stroycash.ru"""

import re
import os

BASE = os.path.dirname(os.path.abspath(__file__))
DOMAIN = "https://doma.stroycash.ru"
OLD_DOMAIN = "https://stroycashdoma.ru"

SCHEMA_ORG = '''<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "name": "Строй Кэш",
  "url": "https://doma.stroycash.ru",
  "logo": "https://doma.stroycash.ru/images/tild3062-3933-4330-b433-393665663762__-__resize__504x___-photoroom.png",
  "image": "https://doma.stroycash.ru/images/tild3062-3933-4330-b433-393665663762__-__resize__504x___-photoroom.png",
  "description": "Строительство домов под ключ в Москве и Московской области. Деревянные, каркасные, кирпичные дома. Подбор земельных участков.",
  "telephone": "+7 (900) 022-93-11",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Москва",
    "addressRegion": "Московская область",
    "addressCountry": "RU"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 55.7558,
    "longitude": 37.6173
  },
  "areaServed": ["Москва", "Московская область"],
  "serviceType": ["Строительство домов под ключ", "Подбор земельных участков", "Каркасные дома", "Деревянные дома"],
  "priceRange": "$$",
  "openingHours": "Mo-Su 09:00-21:00",
  "sameAs": [
    "https://stroycash.ru"
  ]
}
</script>'''

H1_HIDDEN = '<h1 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap">Строй Кэш — строительство домов под ключ в Москве</h1>'

OG_IMAGE_MAIN = f"{DOMAIN}/images/tild3062-3933-4330-b433-393665663762__-__resize__504x___-photoroom.png"

PAGES = {
    "index.html": {
        "canonical": f"{DOMAIN}/",
        "title": "Строй Кэш — Строительство домов под ключ в Москве и МО",
        "og_title": "Строй Кэш — Строительство домов под ключ",
        "description": "Строительство домов под ключ в Москве и Московской области. Деревянные, каркасные и кирпичные дома. Подбор земельных участков. Работаем с 2018 года. Звоните!",
        "og_image": OG_IMAGE_MAIN,
        "add_schema": True,
        "add_h1": True,
    },
    "page50020253.html": {
        "canonical": f"{DOMAIN}/",
        "title": "Строй Кэш — Строительство домов под ключ в Москве и МО",
        "og_title": "Строй Кэш — Строительство домов под ключ",
        "description": "Строительство домов под ключ в Москве и Московской области. Деревянные, каркасные и кирпичные дома. Подбор земельных участков. Работаем с 2018 года. Звоните!",
        "og_image": OG_IMAGE_MAIN,
        "add_schema": True,
        "add_h1": True,
    },
    "ychastok.html": {
        "canonical": f"{DOMAIN}/ychastok",
        "title": "Подбор земельного участка под строительство — Строй Кэш",
        "og_title": "Подбор земельного участка под строительство",
        "description": "Помогаем выбрать и купить земельный участок под строительство дома в Москве и МО. Проверка юридической чистоты, анализ коммуникаций, выезд на место.",
        "og_image": OG_IMAGE_MAIN,
        "add_schema": False,
        "add_h1": True,
    },
    "page52048525.html": {
        "canonical": f"{DOMAIN}/ychastok",
        "title": "Подбор земельного участка под строительство — Строй Кэш",
        "og_title": "Подбор земельного участка под строительство",
        "description": "Помогаем выбрать и купить земельный участок под строительство дома в Москве и МО. Проверка юридической чистоты, анализ коммуникаций, выезд на место.",
        "og_image": OG_IMAGE_MAIN,
        "add_schema": False,
        "add_h1": True,
    },
    "policy.html": {
        "canonical": f"{DOMAIN}/policy",
        "title": "Политика конфиденциальности — Строй Кэш",
        "og_title": "Политика конфиденциальности",
        "description": "Политика конфиденциальности Строй Кэш.",
        "og_image": OG_IMAGE_MAIN,
        "add_schema": False,
        "add_h1": False,
    },
    "page50645151.html": {
        "canonical": f"{DOMAIN}/policy",
        "title": "Политика конфиденциальности — Строй Кэш",
        "og_title": "Политика конфиденциальности",
        "description": "Политика конфиденциальности Строй Кэш.",
        "og_image": OG_IMAGE_MAIN,
        "add_schema": False,
        "add_h1": False,
    },
    "agreement.html": {
        "canonical": f"{DOMAIN}/agreement",
        "title": "Согласие на обработку персональных данных — Строй Кэш",
        "og_title": "Согласие на обработку персональных данных",
        "description": "",
        "og_image": OG_IMAGE_MAIN,
        "add_schema": False,
        "add_h1": False,
    },
    "page90369146.html": {
        "canonical": f"{DOMAIN}/agreement",
        "title": "Согласие на обработку персональных данных — Строй Кэш",
        "og_title": "Согласие на обработку персональных данных",
        "description": "",
        "og_image": OG_IMAGE_MAIN,
        "add_schema": False,
        "add_h1": False,
    },
    "cookie-files.html": {
        "canonical": f"{DOMAIN}/cookie-files",
        "title": "Соглашение об использовании Cookie — Строй Кэш",
        "og_title": "Соглашение Cookie-файлов",
        "description": "",
        "og_image": OG_IMAGE_MAIN,
        "add_schema": False,
        "add_h1": False,
    },
    "page90369386.html": {
        "canonical": f"{DOMAIN}/cookie-files",
        "title": "Соглашение об использовании Cookie — Строй Кэш",
        "og_title": "Соглашение Cookie-файлов",
        "description": "",
        "og_image": OG_IMAGE_MAIN,
        "add_schema": False,
        "add_h1": False,
    },
}


def fix_file(filename, cfg):
    path = os.path.join(BASE, filename)
    if not os.path.exists(path):
        print(f"SKIP (not found): {filename}")
        return

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. lang="ru"
    content = re.sub(r'<html(\s[^>]*)?>', lambda m: f'<html lang="ru">' if 'lang=' not in (m.group(1) or '') else m.group(0), content, count=1)

    # 2. Fix canonical
    content = re.sub(
        r'<link rel="canonical"[^>]*>',
        f'<link rel="canonical" href="{cfg["canonical"]}">',
        content
    )

    # 3. Fix og:url
    content = re.sub(
        r'<meta property="og:url"[^>]*/?>',
        f'<meta property="og:url" content="{cfg["canonical"]}" />',
        content
    )

    # 4. Fix title
    content = re.sub(
        r'<title>[^<]*</title>',
        f'<title>{cfg["title"]}</title>',
        content
    )

    # 5. Fix og:title
    content = re.sub(
        r'<meta property="og:title"[^>]*/?>',
        f'<meta property="og:title" content="{cfg["og_title"]}" />',
        content
    )

    # 6. Fix og:description (only if description is non-empty)
    if cfg["description"]:
        content = re.sub(
            r'<meta property="og:description"[^>]*/?>',
            f'<meta property="og:description" content="{cfg["description"]}" />',
            content
        )

    # 7. Fix meta description
    if cfg["description"]:
        content = re.sub(
            r'<meta name="description"[^>]*/?>',
            f'<meta name="description" content="{cfg["description"]}" />',
            content
        )

    # 8. Fix og:image to absolute URL
    content = re.sub(
        r'<meta property="og:image"[^>]*/?>',
        f'<meta property="og:image" content="{cfg["og_image"]}" />',
        content
    )

    # 9. Replace any remaining old domain references in og tags
    content = content.replace(f'content="{OLD_DOMAIN}', f'content="{DOMAIN}')
    content = content.replace(f'href="{OLD_DOMAIN}', f'href="{DOMAIN}')

    # 10. Add Schema.org before </head>
    if cfg["add_schema"] and SCHEMA_ORG not in content:
        content = content.replace('</head>', f'{SCHEMA_ORG}\n</head>', 1)

    # 11. Add hidden H1 after <body (first occurrence)
    if cfg["add_h1"] and H1_HIDDEN not in content:
        content = re.sub(r'(<body[^>]*>)', r'\1\n' + H1_HIDDEN, content, count=1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"OK: {filename}")


def main():
    for filename, cfg in PAGES.items():
        fix_file(filename, cfg)
    print("\nDone! All files updated.")


if __name__ == "__main__":
    main()
