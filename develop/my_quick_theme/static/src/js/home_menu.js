/** @odoo-module **/

import { WebClient } from "@web/webclient/webclient";
import { patch } from "@web/core/utils/patch";
import { onMounted } from "@odoo/owl";

patch(WebClient.prototype, "my_quick_theme.WebClient", {
    setup() {
        this._super(...arguments);
        
        onMounted(() => {
            // Check if there's no action in the URL hash, which means we just logged in or clicked home
            const hash = window.location.hash;
            if (!hash || !hash.includes('action=')) {
                // Find the app menu toggle button and click it after a short delay
                setTimeout(() => {
                    const appMenuBtn = document.querySelector('.o_navbar_apps_menu .dropdown-toggle');
                    if (appMenuBtn && !appMenuBtn.classList.contains('show')) {
                        appMenuBtn.click();
                    }
                }, 100);
            }
        });
    }
});
