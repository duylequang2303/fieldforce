# My Quick Theme - Deployment Guide

## Server Information
- **Host**: demo002.crmhub.vn (or demo001)
- **SSH User**: root
- **Remote Path**: /opt/odoo19/custom-addons/my_quick_theme/
- **Odoo Conf**: /etc/odoo19/odoo.conf

## Quick Deployment Steps

### 1. Copy files to server via rsync
```bash
rsync -avz develop/my_quick_theme/ root@demo002.crmhub.vn:/opt/odoo19/custom-addons/my_quick_theme/
```

### 2. Fix ownership & Restart Odoo
```bash
ssh root@demo002.crmhub.vn "chown -R odoo19:odoo19 /opt/odoo19/custom-addons/my_quick_theme/ && systemctl restart odoo19"
```

## Odoo UI Steps

### Upgrade Module
- Menu **Apps** → Search `My Quick Theme` → click **Upgrade** (Hoặc qua CLI `--update=my_quick_theme`).

## Module Structure
```
my_quick_theme/
├── __init__.py
├── __manifest__.py
├── static/
│   └── src/
│       ├── scss/
│       │   ├── _variables.scss
│       │   ├── _navbar.scss
│       │   ├── _control_panel.scss
│       │   ├── _cards.scss
│       │   ├── _forms.scss
│       │   ├── _tables.scss
│       │   ├── _calendar.scss
│       │   ├── _app_launcher.scss
│       │   ├── _animations.scss
│       │   ├── _typography.scss
│       │   ├── _mixins.scss
│       │   └── theme.scss
└── views/
    └── assets.xml
```