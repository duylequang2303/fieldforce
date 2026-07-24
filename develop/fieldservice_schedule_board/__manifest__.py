{
    "name": "Field Service Schedule Board",
    "summary": "Custom schedule board view for Field Service Orders",
    "version": "19.0.1.0.0",
    "license": "AGPL-3",
    "category": "Field Service",
    "author": "FieldForce",
    "website": "https://github.com/duylequang2303/fieldforce",
    "depends": ["fieldservice", "web"],
    "data": [
        "views/schedule_board_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "fieldservice_schedule_board/static/src/schedule_board/schedule_board.js",
            "fieldservice_schedule_board/static/src/schedule_board/schedule_board.xml",
            "fieldservice_schedule_board/static/src/schedule_board/schedule_board.scss",
        ]
    },
    "application": False,
    "installable": True,
    "auto_install": False,
}