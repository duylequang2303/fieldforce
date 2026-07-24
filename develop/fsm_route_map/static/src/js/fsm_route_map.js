/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, onMounted, useState, useRef } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function loadCss(href) {
    if (document.querySelector(`link[href="${href}"]`)) {
        return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}

export class FsmRouteMap extends Component {
    static template = "fsm_route_map.RouteMap";
    static props = ["*"];

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.mapRef = useRef("mapContainer");
        this.state = useState({
            loading: true,
            orders: [],
            distanceKm: 0,
            error: null,
        });
        this.routeId =
            (this.props.action.context && this.props.action.context.active_id) ||
            (this.props.action.params && this.props.action.params.route_id) ||
            false;
        this.map = null;
        this.markersLayer = null;
        this.routeLayer = null;

        onWillStart(async () => {
            await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
            loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
            await this.loadOrders();
        });

        onMounted(() => {
            this.tryInitMap();
        });
    }

    async loadOrders() {
        if (!this.routeId) {
            this.state.error = "Không xác định được lộ trình (route) cần hiển thị.";
            this.state.loading = false;
            return;
        }
        const orders = await this.orm.searchRead(
            "fsm.order",
            [["route_id", "=", this.routeId]],
            ["name", "location_id", "route_sequence"]
        );
        const locationIds = [
            ...new Set(orders.map((o) => o.location_id && o.location_id[0]).filter(Boolean)),
        ];
        const locations = locationIds.length
            ? await this.orm.read("fsm.location", locationIds, [
                  "name",
                  "partner_latitude",
                  "partner_longitude",
              ])
            : [];
        const locMap = {};
        for (const loc of locations) {
            locMap[loc.id] = loc;
        }
        this.state.orders = orders
            .map((o) => ({
                ...o,
                location: o.location_id ? locMap[o.location_id[0]] : null,
            }))
            .filter((o) => o.location && o.location.partner_latitude && o.location.partner_longitude)
            .sort((a, b) => (a.route_sequence || 0) - (b.route_sequence || 0));

        if (!this.state.orders.length) {
            this.state.error =
                "Không có điểm nào có tọa độ (partner_latitude/longitude). " +
                "Vào từng Property/Location, bấm 'Geolocate' (module base_geolocalize) để lấy tọa độ trước.";
        }
        this.state.loading = false;
    }

    tryInitMap() {
        if (!this.mapRef.el || !window.L) {
            setTimeout(() => this.tryInitMap(), 300);
            return;
        }
        if (!this.state.orders.length) {
            return;
        }
        const first = this.state.orders[0].location;
        this.map = window.L.map(this.mapRef.el).setView(
            [first.partner_latitude, first.partner_longitude],
            11
        );
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19,
        }).addTo(this.map);
        this.markersLayer = window.L.layerGroup().addTo(this.map);
        this.drawMarkers();
    }

    drawMarkers() {
        this.markersLayer.clearLayers();
        const bounds = [];
        this.state.orders.forEach((order, idx) => {
            const loc = order.location;
            const icon = window.L.divIcon({
                className: "fsm-route-marker",
                html: `<div class="fsm-route-marker-badge">${idx + 1}</div>`,
                iconSize: [26, 26],
            });
            window.L.marker([loc.partner_latitude, loc.partner_longitude], { icon })
                .bindPopup(`<b>${idx + 1}. ${order.name}</b><br/>${loc.name}`)
                .addTo(this.markersLayer);
            bounds.push([loc.partner_latitude, loc.partner_longitude]);
        });
        if (bounds.length) {
            this.map.fitBounds(bounds, { padding: [40, 40] });
        }
    }

    async optimizeRoute() {
        if (this.state.orders.length < 2) {
            this.notification.add("Cần ít nhất 2 điểm để tối ưu tuyến đường", {
                type: "warning",
            });
            return;
        }
        const coords = this.state.orders
            .map((o) => `${o.location.partner_longitude},${o.location.partner_latitude}`)
            .join(";");
        const url =
            `https://router.project-osrm.org/trip/v1/driving/${coords}` +
            `?source=first&roundtrip=false&geometries=geojson`;
        try {
            const resp = await fetch(url);
            const data = await resp.json();
            if (data.code !== "Ok") {
                this.notification.add("OSRM không tính được tuyến (code: " + data.code + ")", {
                    type: "danger",
                });
                return;
            }
            const trip = data.trips[0];
            this.state.distanceKm = Number((trip.distance / 1000).toFixed(1));

            const newOrder = data.waypoints
                .map((wp, i) => ({ orderIdx: i, tripIdx: wp.waypoint_index }))
                .sort((a, b) => a.tripIdx - b.tripIdx)
                .map((wp) => wp.orderIdx);
            this.state.orders = newOrder.map((i, seq) => ({
                ...this.state.orders[i],
                route_sequence: seq + 1,
            }));

            this.drawMarkers();
            if (this.routeLayer) {
                this.map.removeLayer(this.routeLayer);
            }
            const latlngs = trip.geometry.coordinates.map((c) => [c[1], c[0]]);
            this.routeLayer = window.L.polyline(latlngs, { color: "#2b6cb0", weight: 5 }).addTo(
                this.map
            );
            this.map.fitBounds(this.routeLayer.getBounds(), { padding: [40, 40] });
        } catch (e) {
            this.notification.add("Lỗi kết nối tới dịch vụ tính tuyến đường (OSRM)", {
                type: "danger",
            });
        }
    }

    async saveSequence() {
        await Promise.all(
            this.state.orders.map((order) =>
                this.orm.write("fsm.order", [order.id], {
                    route_sequence: order.route_sequence || 0,
                })
            )
        );
        if (this.routeId) {
            await this.orm.write("fsm.route", [this.routeId], {
                total_distance_km: this.state.distanceKm || 0,
            });
        }
        this.notification.add("Đã lưu thứ tự ghé thăm và quãng đường", { type: "success" });
    }
}

registry.category("actions").add("fsm_route_map_action", FsmRouteMap);
