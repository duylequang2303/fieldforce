# Copyright (C) 2026
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
from odoo import fields, models


class FsmOrder(models.Model):
    _inherit = "fsm.order"

    route_id = fields.Many2one(
        "fsm.route", string="Route", ondelete="set null"
    )
    route_sequence = fields.Integer(
        string="Route Sequence",
        default=0,
        help="Visit order for the day, computed by the route optimization feature.",
    )
