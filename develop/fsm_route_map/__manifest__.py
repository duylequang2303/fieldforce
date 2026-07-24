# Copyright (C) 2026
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
{
    "name": "Field Service Route Map",
    "summary": "Route planning and map visualization for Field Service visits (Leaflet + OSRM)",
    "version": "19.0.1.0.0",
    "category": "Field Service",
    "author": "Le Quang",
    "license": "AGPL-3",
    "depends": ["fieldservice", "fieldservice_calendar", "base_geolocalize"],
    "data": [
        "security/ir.model.access.csv",
        "views/fsm_route_views.xml",
        "views/fsm_schedule_views.xml",
        "views/fsm_order_views.xml",
        "data/fsm_route_demo.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "fsm_route_map/static/src/js/fsm_route_map.js",
            "fsm_route_map/static/src/xml/fsm_route_map.xml",
            "fsm_route_map/static/src/scss/fsm_route_map.scss",
        ],
    },
    "installable": True,
    "application": False,
}
