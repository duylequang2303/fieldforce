# Project Context: Odoo Field Service & Flutter Mobile App

Tài liệu này lưu trữ thông tin bối cảnh dự án (Project Context) cho hệ thống **Odoo Field Service Management (FSM)** và kế hoạch phát triển **Ứng dụng di động Flutter dành cho Worker**.

---

## 1. Thông tin chung Dự án
* **Hệ thống Backend:** Odoo v19.0 (OCA - Odoo Community Association)
* **Kho chứa mã nguồn:** [field-service](file:///home/odoodev/Duck/odoo/fieldforce)
* **Mục tiêu:** Quản lý địa điểm dịch vụ (Locations), điều phối nhân viên (Workers), quản lý yêu cầu công việc (Orders), tích hợp kho bãi, phương tiện, thời gian và chi phí.

### Thông tin Server & Deployment Backend
* **Server URL:** `https://demo001.crmhub.vn/`
* **Tài khoản đăng nhập:** `admin` / `CRMHub@2026`
* **SSH truy cập:** `ssh root@demo001.crmhub.vn`
* **File cấu hình Odoo:** `/etc/odoo19/odoo.conf`
* **Lệnh restart Odoo:** `systemctl restart odoo19`
* **SSH Public Key:**
  ```text
  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAWcPYvXwMUMOeEbO32SkTBuW7xIT2UVn0YRs1XyrinQ duylequang588@gmail.com
  ```

### Thông tin Repository GitHub & Access Token
* **Repository:** `https://github.com/duylequang2303/fieldforce`
* **Username:** `duylequang2303`
* **Personal Access Token (PAT):** `Configured in ~/.git-credentials`

---

## 2. Danh sách các Module Odoo hiện tại trong Workspace
Dự án bao gồm các phân hệ cốt lõi sau:

1. **[fieldservice](file:///home/odoodev/Duck/odoo/fieldforce/fieldservice):** Phân hệ cốt lõi quản lý Địa điểm (`fsm.location`), Nhân viên hiện trường (`fsm.person`) và Đơn dịch vụ (`fsm.order`).
2. **[fsm_route_map](file:///home/odoodev/Duck/odoo/fieldforce/fsm_route_map):** Quản lý bản đồ lộ trình di chuyển của Worker.
3. **[fieldservice_stock](file:///home/odoodev/Duck/odoo/fieldforce/fieldservice_stock) & [fieldservice_equipment_stock](file:///home/odoodev/Duck/odoo/fieldforce/fieldservice_equipment_stock):** Tích hợp dịch chuyển kho và thiết bị phục vụ công việc hiện trường.
4. **[fieldservice_expense](file:///home/odoodev/Duck/odoo/fieldforce/fieldservice_expense):** Báo cáo chi phí phát sinh trong quá trình thực hiện Đơn dịch vụ.
5. **[fieldservice_timesheet](file:///home/odoodev/Duck/odoo/fieldforce/fieldservice_timesheet):** Ghi nhận thời gian làm việc thực tế của Worker.
6. **[fieldservice_vehicle](file:///home/odoodev/Duck/odoo/fieldforce/fieldservice_vehicle):** Quản lý đội xe và phân công tài xế/worker đi làm việc.
7. **[fieldservice_portal](file:///home/odoodev/Duck/odoo/fieldforce/fieldservice_portal):** Cung cấp cổng thông tin (Portal) kết nối khách hàng và đối tác.

---

## 3. Dự án Flutter Mobile App cho Worker (`fieldforce_mobile`)

Để tối ưu hóa năng suất của nhân viên thực địa (Worker), ứng dụng di động đa nền tảng đã được khởi tạo bằng **Flutter** kết nối trực tiếp với backend Odoo FSM.

* **Thư mục kho nguồn Mobile App:** [fieldforce_mobile](file:///home/odoodev/Duck/fieldforce_mobile) (nằm độc lập song song với Odoo backend).
* **Mã nguồn tham khảo (Mobo Open Source):** Đã clone các repository tham khảo từ bộ `mobo-open-source` tại [references](file:///home/odoodev/Duck/fieldforce_mobile/references):
  * [mobo_delivery](file:///home/odoodev/Duck/fieldforce_mobile/references/mobo_delivery): Tham khảo định vị GPS, lộ trình di chuyển (`fsm_route_map`).
  * [mobo_inventory](file:///home/odoodev/Duck/fieldforce_mobile/references/mobo_inventory): Tham khảo quản lý vật tư & quét mã vạch Barcode/QR (`fieldservice_stock`).
  * [mobo_expense](file:///home/odoodev/Duck/fieldforce_mobile/references/mobo_expense): Tham khảo quản lý chi phí & hóa đơn (`fieldservice_expense`).

### A. Định hướng Kiến trúc Kỹ thuật
* **Kết nối Odoo API:** Sử dụng `odoo_rpc` (RESTful / XML-RPC client) để đồng bộ dữ liệu với Odoo FSM backend.
* **Đồng bộ Ngoại tuyến (Offline Synchronization):** Sử dụng Local Database (`Isar DB`) lưu trữ dữ liệu Đơn dịch vụ (`fsm.order`) khi ngoài vùng phủ sóng.
* **Xác thực Sinh trắc học (Biometrics):** Đăng nhập nhanh qua FaceID / Vân tay (`local_auth`).

### B. Các tính năng cốt lõi & Tương ứng Module Odoo
1. **Lịch trình & Lộ trình (Tham khảo `mobo_delivery` & `fsm_route_map`):**
   * Hiển thị danh sách Đơn dịch vụ (`fsm.order`) được giao trong ngày.
   * Định vị GPS (`geolocator`), chỉ đường và ghi nhận tọa độ di chuyển.
2. **Thao tác Công việc:**
   * Cập nhật trạng thái công việc (Bắt đầu, Đang thực hiện, Hoàn thành).
   * Chụp ảnh nghiệm thu công trình (`image_picker`), lấy chữ ký khách hàng (`signature`).
3. **Quản lý Vật tư tiêu hao (Tham khảo `mobo_inventory` & `fieldservice_stock`):**
   * Quét mã vạch (Barcode/QR code via `mobile_scanner`) vật tư trên xe dịch vụ để tự động tạo phiếu dịch chuyển kho trên Odoo.
4. **Báo cáo Chi phí & Thời gian (Tham khảo `mobo_expense` & `fieldservice_timesheet`):**
   * Chấm công / Ghi nhận Timesheet giờ làm việc thực tế (`fieldservice_timesheet`).
   * Chụp ảnh hóa đơn xăng xe, ăn uống để gửi yêu cầu thanh toán chi phí (`fieldservice_expense`).

