# Copyright (C) 2026
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
from odoo import fields, models


class FSMLocation(models.Model):
    _inherit = "fsm.location"

    partner_latitude = fields.Float(
        related="partner_id.partner_latitude",
        readonly=False,
        store=True,
        string="Geo Latitude",
    )
    partner_longitude = fields.Float(
        related="partner_id.partner_longitude",
        readonly=False,
        store=True,
        string="Geo Longitude",
    )
