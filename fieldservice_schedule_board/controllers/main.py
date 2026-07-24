from odoo import http
from odoo.http import request
from odoo.fields import Domain
from datetime import datetime, timedelta


class ScheduleBoardController(http.Controller):

    @http.route('/schedule_board/teams', type='json', auth='user')
    def get_teams(self):
        """Get all teams"""
        teams = request.env['fsm.team'].search([])
        return [{
            'id': t.id,
            'name': t.name,
            'order_count': t.order_count,
            'color': t.color,
        } for t in teams]

    @http.route('/schedule_board/orders_by_team', type='json', auth='user')
    def get_orders_by_team(self, team_id, date_str):
        """Get orders for a specific team on a given date"""
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d')
        except (ValueError, TypeError):
            date = datetime.now()

        day_start = date.replace(hour=0, minute=0, second=0)
        day_end = date.replace(hour=23, minute=59, second=59)

        orders = request.env['fsm.order'].search([
            ('team_id', '=', team_id),
            ('scheduled_date_start', '>=', str(day_start)),
            ('scheduled_date_start', '<=', str(day_end)),
        ], order='scheduled_date_start asc')

        return self._serialize_orders(orders)

    @http.route('/schedule_board/unscheduled_orders', type='json', auth='user')
    def get_unscheduled_orders(self, search_term=None, tag_ids=None):
        """Get orders without scheduled date"""
        domain = [
            ('scheduled_date_start', '=', False),
            ('stage_id.is_closed', '=', False),
        ]
        if search_term:
            domain.append(('name', 'ilike', search_term))
        if tag_ids:
            domain.append(('tag_ids', 'in', tag_ids))

        orders = request.env['fsm.order'].search(domain, limit=100)
        return self._serialize_orders(orders)

    @http.route('/schedule_board/order_detail', type='json', auth='user')
    def get_order_detail(self, order_id):
        """Get full order detail for the panel"""
        order = request.env['fsm.order'].browse(order_id)
        if not order.exists():
            return {}

        location = order.location_id
        person = order.person_id
        team = order.team_id

        return {
            'id': order.id,
            'name': order.name,
            'date_start': order.scheduled_date_start,
            'date_end': order.scheduled_date_end,
            'duration': order.scheduled_duration,
            'location': {
                'id': location.id,
                'name': location.name,
                'street': location.street or '',
                'street2': location.street2 or '',
                'city': location.city or '',
                'zip': location.zip or '',
                'phone': location.phone or '',
                'full_address': f"{location.street or ''}, {location.city or ''} {location.zip or ''}".strip().strip(','),
            },
            'person': {
                'id': person.id,
                'name': person.name or '',
                'phone': person.phone or '',
            },
            'team': {
                'id': team.id,
                'name': team.name or '',
            },
            'stage': {
                'id': order.stage_id.id,
                'name': order.stage_id.name or '',
                'color': order.custom_color or '#FFFFFF',
                'is_closed': order.is_closed,
            },
            'description': order.description or '',
            'instructions': order.todo or '',
            'priority': order.priority,
            'tag_ids': [{'id': t.id, 'name': t.name, 'color': t.color} for t in order.tag_ids],
            'signed_by': order.signed_by or '',
            'signed_on': order.signed_on or '',
        }

    @http.route('/schedule_board/update_order', type='json', auth='user')
    def update_order(self, order_id, **kwargs):
        """Update order fields (used for drag & drop)"""
        order = request.env['fsm.order'].browse(order_id)
        if not order.exists():
            return {'error': 'Order not found'}

        vals = {}
        if 'team_id' in kwargs:
            vals['team_id'] = kwargs['team_id']
        if 'person_id' in kwargs:
            vals['person_id'] = kwargs['person_id']
        if 'scheduled_date_start' in kwargs:
            vals['scheduled_date_start'] = kwargs['scheduled_date_start']
        if 'scheduled_duration' in kwargs:
            vals['scheduled_duration'] = kwargs['scheduled_duration']
        if 'scheduled_date_end' in kwargs:
            vals['scheduled_date_end'] = kwargs['scheduled_date_end']

        if vals:
            order.write(vals)
            return {'success': True}
        return {'error': 'No values to update'}

    @http.route('/schedule_board/update_stage', type='json', auth='user')
    def update_stage(self, order_id, stage_id):
        """Update order stage"""
        order = request.env['fsm.order'].browse(order_id)
        if order.exists():
            order.write({'stage_id': stage_id})
            return {'success': True}
        return {'error': 'Order not found'}

    @http.route('/schedule_board/week_orders', type='json', auth='user')
    def get_week_orders(self, start_date_str):
        """Get all orders for a full week, grouped by team"""
        try:
            start = datetime.strptime(start_date_str, '%Y-%m-%d')
        except (ValueError, TypeError):
            start = datetime.now()

        end = start + timedelta(days=6)
        start_str = start.replace(hour=0, minute=0, second=0)
        end_str = end.replace(hour=23, minute=59, second=59)

        orders = request.env['fsm.order'].search([
            ('scheduled_date_start', '>=', str(start_str)),
            ('scheduled_date_start', '<=', str(end_str)),
        ])

        teams = request.env['fsm.team'].search([])
        result = {}
        for team in teams:
            result[team.id] = {
                'team': {'id': team.id, 'name': team.name},
                'orders': self._serialize_orders(orders.filtered(lambda o: o.team_id.id == team.id)),
            }

        return result

    def _serialize_orders(self, orders):
        """Convert orders to JSON-safe dicts"""
        result = []
        for order in orders:
            location = order.location_id
            stage = order.stage_id
            person = order.person_id
            result.append({
                'id': order.id,
                'name': order.name,
                'display_name': order.display_name,
                'scheduled_date_start': order.scheduled_date_start,
                'scheduled_date_end': order.scheduled_date_end,
                'scheduled_duration': order.scheduled_duration,
                'priority': order.priority,
                'location': {
                    'id': location.id,
                    'name': location.name or '',
                    'city': location.city or '',
                    'street': location.street or '',
                },
                'address_short': f"{location.street or ''}, {location.city or ''}".strip().strip(','),
                'person': {
                    'id': person.id,
                    'name': person.name or '',
                },
                'stage': {
                    'id': stage.id,
                    'name': stage.name or '',
                    'color': order.custom_color or '#FFFFFF',
                    'is_closed': order.is_closed,
                },
                'tag_ids': [{'id': t.id, 'name': t.name, 'color': t.color} for t in order.tag_ids],
                'color': order.color,
            })
        return result