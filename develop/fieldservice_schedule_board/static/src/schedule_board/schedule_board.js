/** @odoo-module **/
import { registry } from "@web/core/registry";
import { Component, useState, onWillStart, onMounted, useRef } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

// ===================== Sub-Components =====================

class OrderCard extends Component {
    static template = "fieldservice_schedule_board.OrderCard";
    static props = {
        order: Object,
        onDragStart: Function,
        onOrderClick: Function,
    };

    getStageClass(stage) {
        if (!stage) return '';
        const name = (stage.name || '').toLowerCase();
        if (name.includes('complete') || name.includes('done') || name.includes('hoàn')) return 'stage-completed';
        if (name.includes('cancel') || name.includes('hủy')) return 'stage-cancelled';
        if (name.includes('progress') || name.includes('doing') || name.includes('processing') || name.includes('đang')) return 'stage-progress';
        return 'stage-default';
    }

    getStageColor(stage) {
        if (!stage) return '#FFFFFF';
        return stage.color || '#FFFFFF';
    }

    formatTime(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    formatTagColor(tagColor) {
        if (!tagColor) return '#6c757d';
        return tagColor;
    }
}

class UnscheduledSidebar extends Component {
    static template = "fieldservice_schedule_board.UnscheduledSidebar";
    static props = {
        orders: Array,
        searchTerm: String,
        onSearchInput: Function,
        onDragStart: Function,
        onDrop: Function,
        onOrderClick: Function,
    };

    formatTime(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
}

class DetailPanel extends Component {
    static template = "fieldservice_schedule_board.DetailPanel";
    static props = {
        order: Object,
        onClose: Function,
    };

    formatDisplayDate(date) {
        if (!date) return 'Not set';
        const d = new Date(date);
        return d.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    formatTime(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
}

class ChatWidget extends Component {
    static template = "fieldservice_schedule_board.ChatWidget";
    static props = {
        isOpen: Boolean,
        onToggle: Function,
    };
}

// ===================== Main Component =====================

class ScheduleBoard extends Component {
    static template = "fieldservice_schedule_board.ScheduleBoard";
    static components = {
        UnscheduledSidebar,
        DetailPanel,
        ChatWidget,
        OrderCard,
        TeamColumnHeader,
    };

    setup() {
        this.rpc = useService("rpc");
        this.state = useState({
            teams: [],
            ordersByTeam: {},
            unscheduledOrders: [],
            selectedOrderId: null,
            selectedOrderDetail: null,
            currentDate: new Date(),
            weekStart: this.getWeekStart(new Date()),
            sidebarOpen: true,
            detailPanelOpen: false,
            chatOpen: false,
            searchTerm: '',
            loading: true,
            dayHeaders: [],
        });

        onWillStart(async () => {
            await this.loadTeams();
            await this.loadWeekData();
        });

        onMounted(() => {
            document.addEventListener('dragend', (e) => this.onDragEnd(e));
        });
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    formatDate(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    formatTime(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    async loadTeams() {
        try {
            this.state.teams = await this.rpc('/schedule_board/teams', {});
        } catch (e) {
            console.error('Failed to load teams:', e);
        }
    }

    async loadWeekData() {
        this.state.loading = true;
        try {
            const weekStartStr = this.formatDate(this.state.weekStart);

            const headers = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(this.state.weekStart);
                d.setDate(d.getDate() + i);
                headers.push({
                    date: d,
                    dateStr: this.formatDate(d),
                    label: d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' }).toUpperCase(),
                    isToday: this.isToday(d),
                });
            }
            this.state.dayHeaders = headers;

            const weekData = await this.rpc('/schedule_board/week_orders', {
                start_date_str: weekStartStr,
            });
            this.state.ordersByTeam = weekData || {};

            await this.loadUnscheduledOrders();
        } catch (e) {
            console.error('Failed to load week data:', e);
        }
        this.state.loading = false;
    }

    async loadUnscheduledOrders() {
        try {
            this.state.unscheduledOrders = await this.rpc('/schedule_board/unscheduled_orders', {
                search_term: this.state.searchTerm || null,
                tag_ids: null,
            });
        } catch (e) {
            console.error('Failed to load unscheduled orders:', e);
        }
    }

    async onOrderClick(orderId) {
        this.state.selectedOrderId = orderId;
        this.state.detailPanelOpen = true;
        try {
            this.state.selectedOrderDetail = await this.rpc('/schedule_board/order_detail', {
                order_id: orderId,
            });
        } catch (e) {
            console.error('Failed to load order detail:', e);
        }
    }

    closeDetailPanel() {
        this.state.detailPanelOpen = false;
        this.state.selectedOrderId = null;
        this.state.selectedOrderDetail = null;
    }

    toggleSidebar() {
        this.state.sidebarOpen = !this.state.sidebarOpen;
    }

    toggleChat() {
        this.state.chatOpen = !this.state.chatOpen;
    }

    prevWeek() {
        const d = new Date(this.state.weekStart);
        d.setDate(d.getDate() - 7);
        this.state.weekStart = d;
        this.loadWeekData();
    }

    nextWeek() {
        const d = new Date(this.state.weekStart);
        d.setDate(d.getDate() + 7);
        this.state.weekStart = d;
        this.loadWeekData();
    }

    goToToday() {
        this.state.weekStart = this.getWeekStart(new Date());
        this.loadWeekData();
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    get weekLabel() {
        const start = this.state.weekStart;
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const startStr = start.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
        const endStr = end.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' });
        return `${startStr} - ${endStr}`;
    }

    getStageColor(stage) {
        if (!stage) return '#FFFFFF';
        return stage.color || '#FFFFFF';
    }

    getStageClass(stage) {
        if (!stage) return '';
        const name = (stage.name || '').toLowerCase();
        if (name.includes('complete') || name.includes('done') || name.includes('hoàn')) return 'stage-completed';
        if (name.includes('cancel') || name.includes('hủy')) return 'stage-cancelled';
        if (name.includes('progress') || name.includes('doing') || name.includes('processing') || name.includes('đang')) return 'stage-progress';
        return 'stage-default';
    }

    onDragStart(ev, orderId) {
        ev.dataTransfer.setData('text/plain', orderId.toString());
        ev.dataTransfer.effectAllowed = 'move';
    }

    onDragOver(ev) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
    }

    async onDropOnTeam(ev, teamId, dayStr) {
        ev.preventDefault();
        const orderId = parseInt(ev.dataTransfer.getData('text/plain'));
        if (!orderId) return;

        try {
            const scheduledStart = `${dayStr} 08:00:00`;
            await this.rpc('/schedule_board/update_order', {
                order_id: orderId,
                team_id: teamId,
                scheduled_date_start: scheduledStart,
                scheduled_duration: 1.0,
            });
            await this.loadWeekData();
        } catch (e) {
            console.error('Failed to update order:', e);
        }
    }

    async onDropUnscheduled(ev) {
        ev.preventDefault();
        const orderId = parseInt(ev.dataTransfer.getData('text/plain'));
        if (!orderId) return;

        try {
            await this.rpc('/schedule_board/update_order', {
                order_id: orderId,
                scheduled_date_start: false,
                scheduled_duration: false,
                scheduled_date_end: false,
            });
            await this.loadWeekData();
        } catch (e) {
            console.error('Failed to unschedule order:', e);
        }
    }

    onDragEnd(ev) {}

    async onSearchInput(ev) {
        this.state.searchTerm = ev.target.value;
        await this.loadUnscheduledOrders();
    }
}

// Simple team column header - renders inline
class TeamColumnHeader extends Component {
    static template = "fieldservice_schedule_board.TeamColumnHeader";
    static props = {
        team: Object,
    };
}

// Register as client action
registry.category("actions").add("schedule_board", ScheduleBoard);

export default ScheduleBoard;