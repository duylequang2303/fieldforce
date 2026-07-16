# Copyright (C) 2026
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
from odoo import fields, models


class FsmRoute(models.Model):
    _name = "fsm.route"
    _description = "Field Service Route"
    _order = "date desc, id desc"

    name = fields.Char(required=True, default="New Route")
    date = fields.Date(required=True, default=fields.Date.context_today)
    person_id = fields.Many2one("fsm.person", string="Technician")
    team_id = fields.Many2one("fsm.team", string="Team")
    order_ids = fields.One2many("fsm.order", "route_id", string="Visit Stops")
    order_count = fields.Integer(compute="_compute_order_count", string="Stops")
    total_distance_km = fields.Float(
        string="Distance (km)",
        help="Automatically updated after clicking Optimize Route on the map.",
    )
    state = fields.Selection(
        [
            ("draft", "Draft"),
            ("planned", "Planned"),
            ("done", "Done"),
        ],
        default="draft",
        string="Status",
    )

    def _compute_order_count(self):
        for rec in self:
            rec.order_count = len(rec.order_ids)

    def action_open_map(self):
        self.ensure_one()
        return {
            "type": "ir.actions.client",
            "tag": "fsm_route_map_action",
            "name": "Route Map - %s" % self.name,
            "context": {"active_id": self.id},
        }
