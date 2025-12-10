> **Sản phẩm:** PaaS Platform cho việc tạo, deploy và quản lý ứng dụng web  
> **Mục tiêu:** Tự động hóa deployment, giúp user tập trung vào code  
> **Nguyên tắc phát triển:** Mỗi feature hoàn thành → Test → Ổn định → Feature tiếp theo

---

## ROLES & PERMISSIONS

| Role           | Mô tả                  | Quyền hạn chính                     |
| -------------- | ---------------------- | ----------------------------------- |
| **User**       | Người dùng deploy app  | Quản lý Space/Project/Service       |
| **Team Admin** | Quản lý nhóm           | Quản lý members, xem tất cả project |
| **Admin**      | Quản trị toàn hệ thống | Quản lý users, quotas, settings     |

---

## CORE FEATURES (MVP) - Ưu tiên cao nhất

---

### F01: user-authentication

- **Vấn đề giải quyết:** User cần đăng nhập để sử dụng platform
- **Người sử dụng:** Tất cả users
- **User Stories:**
  1. User truy cập trang login, thấy nút “Login with GitHub”
  2. User click → Redirect đến GitHub → Authorize → Quay lại platform
  3. User lần đầu login → Tài khoản được tạo tự động
  4. User đã login → Redirect đến Dashboard
  5. User có thể logout
- **Acceptance Criteria:**
  - [ ] Trang login hiển thị đúng
  - [ ] OAuth flow hoạt động với GitHub
  - [ ] JWT token được tạo và lưu
  - [ ] Protected routes yêu cầu authentication
  - [ ] Logout xóa token và redirect về login
- **Technical Notes:**
  - GitHub OAuth App
  - JWT cho session management
  - Lưu user info vào PostgreSQL
- **Dependencies:** Không
- **Estimate:** 6-8 giờ

---

### F02: space-management

- **Vấn đề giải quyết:** User cần workspace riêng để tổ chức projects
- **Người sử dụng:** User, Team Admin
- **User Stories:**
  1. User tạo Space mới với tên và mô tả
  2. User xem danh sách Spaces của mình
  3. User vào một Space để xem các Projects bên trong
  4. User đổi tên hoặc xóa Space (nếu trống)
  5. User xem resource quota đã sử dụng của Space
- **Acceptance Criteria:**
  - [ ] Tạo Space → K8s Namespace được tạo tự động
  - [ ] ResourceQuota được apply theo tier của user
  - [ ] Xóa Space → Namespace bị xóa (chỉ khi không có project)
  - [ ] UI hiển thị quota usage (CPU, RAM đã dùng / giới hạn)
- **Technical Notes:**
  - 1 Space = 1 K8s Namespace
  - ResourceQuota theo tier (Free/Standard/Pro)
  - Naming convention: `space-{userId}-{spaceName}`
- **Dependencies:** F01
- **Estimate:** 6-8 giờ

---

### F03: project-management

- **Vấn đề giải quyết:** User cần nhóm các services liên quan lại với nhau
- **Người sử dụng:** User
- **User Stories:**
  1. User tạo Project mới trong một Space
  2. User xem danh sách Projects trong Space
  3. User vào Project để xem các Services
  4. User đổi tên, thêm mô tả cho Project
  5. User xóa Project (xóa tất cả services bên trong)
- **Acceptance Criteria:**
  - [ ] Project được tạo với labels trong K8s
  - [ ] List services theo project label
  - [ ] Xóa project → Xóa tất cả K8s resources có label đó
  - [ ] UI hiển thị số services, trạng thái tổng quan
- **Technical Notes:**
  - Project = logical grouping bằng K8s labels
  - Label: `paas.io/project: {projectId}`
- **Dependencies:** F02
- **Estimate:** 4-6 giờ

---

### F04: deploy-docker-image

- **Vấn đề giải quyết:** User muốn deploy ứng dụng từ Docker image có sẵn
- **Người sử dụng:** User
- **User Stories:**
  1. User click “Create Service” trong một Project
  2. User chọn method “Deploy Docker Image”
  3. User nhập: image name (vd: nginx:alpine), port, tên service
  4. User click Deploy → Service được tạo
  5. User nhận được URL để truy cập service
- **Acceptance Criteria:**
  - [ ] Validate image name format
  - [ ] Tạo K8s Deployment với image đó
  - [ ] Tạo K8s Service (ClusterIP)
  - [ ] Tạo K8s Ingress với auto-generated subdomain
  - [ ] Service accessible qua URL trong 1-2 phút
- **Technical Notes:**
  - Subdomain format: `{serviceName}-{projectName}.{baseDomain}`
  - Default resources: 100m CPU, 128Mi RAM
  - Ingress class: traefik
- **Dependencies:** F03
- **Estimate:** 8-10 giờ

---

### F05: service-status-view

- **Vấn đề giải quyết:** User cần biết service đang chạy hay có lỗi
- **Người sử dụng:** User
- **User Stories:**
  1. User xem danh sách services với status badges
  2. User click vào service để xem chi tiết
  3. User thấy: Running/Pending/Error status
  4. User thấy: số replicas, image đang dùng, URL
  5. Nếu Error, user thấy thông tin lỗi cơ bản
- **Acceptance Criteria:**
  - [ ] Status được cập nhật real-time (hoặc polling 10s)
  - [ ] Hiển thị đúng các trạng thái K8s pod
  - [ ] Error message rõ ràng (ImagePullBackOff, CrashLoopBackOff…)
  - [ ] Clickable URL để truy cập service
- **Technical Notes:**
  - Query K8s API: pod status, conditions
  - Map K8s status → User-friendly status
- **Dependencies:** F04
- **Estimate:** 4-6 giờ

---

### F06: service-environment-variables

- **Vấn đề giải quyết:** User cần cấu hình ENV cho ứng dụng
- **Người sử dụng:** User
- **User Stories:**
  1. User vào trang chi tiết Service
  2. User click tab “Environment Variables”
  3. User thêm/sửa/xóa các ENV variables
  4. User click Save → Service restart với ENV mới
  5. User có thể đánh dấu ENV là “Secret” (ẩn value)
- **Acceptance Criteria:**
  - [ ] CRUD ENV variables
  - [ ] Normal ENV → K8s ConfigMap
  - [ ] Secret ENV → K8s Secret
  - [ ] Save → Deployment rollout restart
  - [ ] UI ẩn value của secret ENV
- **Technical Notes:**
  - ConfigMap và Secret cùng namespace với service
  - Naming: `{serviceName}-env`, `{serviceName}-secret`
- **Dependencies:** F05
- **Estimate:** 4-6 giờ

---

### F07: service-logs-viewer

- **Vấn đề giải quyết:** User cần xem logs để debug
- **Người sử dụng:** User
- **User Stories:**
  1. User vào trang chi tiết Service
  2. User click tab “Logs”
  3. User thấy logs gần nhất của container
  4. User có thể chọn số dòng muốn xem (50/100/500)
  5. User có thể download logs
- **Acceptance Criteria:**
  - [ ] Hiển thị logs với timestamps
  - [ ] Auto-scroll khi có logs mới (optional)
  - [ ] Hiển thị logs của tất cả pods nếu có nhiều replicas
  - [ ] Không crash khi logs quá lớn
- **Technical Notes:**
  - K8s API: GET /api/v1/namespaces/{ns}/pods/{pod}/log
  - Giới hạn: tailLines parameter
- **Dependencies:** F05
- **Estimate:** 4-5 giờ

---

### F08: service-metrics-dashboard

- **Vấn đề giải quyết:** User cần xem resource usage để tối ưu
- **Người sử dụng:** User, Team Admin, Platform Admin
- **User Stories:**
  1. User vào trang chi tiết Service
  2. User click tab “Metrics”
  3. User thấy charts: CPU usage, Memory usage
  4. User có thể chọn time range (1h/6h/24h/7d)
  5. User thấy current vs limit để biết còn bao nhiêu headroom
- **Acceptance Criteria:**
  - [ ] CPU chart hiển thị % usage
  - [ ] Memory chart hiển thị MB/GB usage
  - [ ] Hiển thị limit line trên chart
  - [ ] Data từ Prometheus API
- **Technical Notes:**
  - Query Prometheus: container_cpu_usage_seconds_total, container_memory_usage_bytes
  - Chart library: Recharts hoặc Chart.js
- **Dependencies:** F05, Prometheus (đã setup)
- **Estimate:** 6-8 giờ

---

### F09: service-restart-delete

- **Vấn đề giải quyết:** User cần restart hoặc xóa service
- **Người sử dụng:** User
- **User Stories:**
  1. User vào trang chi tiết Service
  2. User click “Restart” → Pods được recreate
  3. User click “Delete” → Confirm dialog → Service bị xóa
  4. Sau khi xóa, redirect về Project page
- **Acceptance Criteria:**
  - [ ] Restart = kubectl rollout restart deployment
  - [ ] Delete = Xóa Deployment + Service + Ingress + ConfigMap + Secret
  - [ ] Confirm dialog trước khi xóa
  - [ ] Loading state trong khi thực hiện
- **Dependencies:** F05
- **Estimate:** 2-3 giờ

---

### F10: manual-scaling

- **Vấn đề giải quyết:** User cần điều chỉnh resources và replicas
- **Người sử dụng:** User
- **User Stories:**
  1. User vào trang chi tiết Service
  2. User click tab “Scaling”
  3. User điều chỉnh số replicas (1-10)
  4. User điều chỉnh CPU/Memory limits
  5. User click Apply → Deployment updated
- **Acceptance Criteria:**
  - [ ] Slider hoặc input cho replicas
  - [ ] Input cho CPU (millicores) và Memory (Mi)
  - [ ] Validate không vượt quá quota của Space
  - [ ] Apply → Rolling update
- **Technical Notes:**
  - Kiểm tra ResourceQuota trước khi apply
  - Show warning nếu gần hết quota
- **Dependencies:** F05, F08
- **Estimate:** 4-5 giờ

---

### F11: platform-dashboard

- **Vấn đề giải quyết:** Platform Admin cần overview toàn hệ thống
- **Người sử dụng:** Platform Admin
- **User Stories:**
  1. Admin login → Thấy Platform Dashboard
  2. Admin thấy: tổng users, tổng spaces, tổng services
  3. Admin thấy: cluster resource usage (CPU/RAM tổng)
  4. Admin thấy: list users mới đăng ký gần đây
  5. Admin có thể navigate đến quản lý chi tiết
- **Acceptance Criteria:**
  - [ ] Stats cards: users, spaces, projects, services
  - [ ] Cluster metrics từ Prometheus
  - [ ] Recent users list
  - [ ] Navigation đến admin sections
- **Dependencies:** F01, F08
- **Estimate:** 4-6 giờ

---

### F12: user-management-admin

- **Vấn đề giải quyết:** Platform Admin cần quản lý users
- **Người sử dụng:** Platform Admin
- **User Stories:**
  1. Admin xem danh sách tất cả users
  2. Admin search/filter users
  3. Admin xem chi tiết user (spaces, projects, usage)
  4. Admin thay đổi tier của user (Free/Standard/Pro)
  5. Admin disable/enable user account
- **Acceptance Criteria:**
  - [ ] Paginated user list
  - [ ] Search by name/email
  - [ ] Change tier → Update ResourceQuota của user’s spaces
  - [ ] Disable → User không thể login
- **Dependencies:** F01, F02
- **Estimate:** 5-6 giờ

---

## ENHANCED FEATURES - Ưu tiên sau MVP

> Nâng cao trải nghiệm, thêm deployment methods

---

### F13: scaffold-from-template

- **Vấn đề giải quyết:** User muốn bắt đầu project mới nhanh chóng
- **Người sử dụng:** User
- **User Stories:**
  1. User click “Create Project from Template”
  2. User thấy catalog templates: React, Next.js, NestJS, Static Site…
  3. User chọn template, nhập tên project
  4. User click Create → GitHub repo được tạo từ template
  5. User nhận được repo URL và auto-deploy được setup
- **Acceptance Criteria:**
  - [ ] Template catalog với preview/description
  - [ ] GitHub repo tạo từ template repo
  - [ ] GitHub Actions workflow được inject
  - [ ] Webhook được setup tự động
  - [ ] First deploy triggered
- **Technical Notes:**
  - GitHub API: Create repo from template
  - Inject .github/workflows/deploy.yml
  - Setup webhook pointing to platform
- **Dependencies:** F04, GitHub API integration
- **Estimate:** 10-12 giờ

---

### F14: deploy-from-git-repo

- **Vấn đề giải quyết:** User có sẵn code trên GitHub, muốn deploy
- **Người sử dụng:** User
- **User Stories:**
  1. User click “Import from GitHub”
  2. User thấy list repos của mình (từ GitHub)
  3. User chọn repo, chọn branch
  4. Platform detect: Dockerfile, hoặc buildpack (Node/Python/Go)
  5. User confirm → Webhook setup → First build triggered
- **Acceptance Criteria:**
  - [ ] List user’s GitHub repos
  - [ ] Auto-detect project type
  - [ ] Setup GitHub webhook
  - [ ] Inject GitHub Actions nếu chưa có
  - [ ] Build và deploy thành công
- **Technical Notes:**
  - Detect order: Dockerfile → package.json → requirements.txt → go.mod
  - Different build strategies per type
- **Dependencies:** F13
- **Estimate:** 10-12 giờ

---

### F15: auto-deploy-webhook

- **Vấn đề giải quyết:** Tự động deploy khi push code
- **Người sử dụng:** User (automated)
- **User Stories:**
  1. User push code lên GitHub
  2. GitHub Actions build → Push image to [ghcr.io](http://ghcr.io/)
  3. GitHub Actions call webhook
  4. Platform receive webhook → Update deployment với image mới
  5. User thấy deployment history updated
- **Acceptance Criteria:**
  - [ ] Webhook endpoint secure (signature verification)
  - [ ] Parse payload để lấy image tag
  - [ ] Update K8s Deployment
  - [ ] Deployment history recorded
  - [ ] Notification (optional) khi deploy xong
- **Dependencies:** F13 hoặc F14
- **Estimate:** 6-8 giờ

---

### F16: deployment-history-rollback

- **Vấn đề giải quyết:** User cần xem history và rollback nếu có lỗi
- **Người sử dụng:** User
- **User Stories:**
  1. User vào Service detail → Tab “Deployments”
  2. User thấy list các lần deploy (time, image tag, status)
  3. User click “Rollback” trên một version cũ
  4. Confirm → Deployment rollback về version đó
  5. Current version updated
- **Acceptance Criteria:**
  - [ ] Store deployment history trong database
  - [ ] Show: timestamp, image, triggered by (push/manual), status
  - [ ] Rollback button hoạt động
  - [ ] K8s deployment updated với old image
- **Dependencies:** F15
- **Estimate:** 5-6 giờ

---

### F17: custom-domain

- **Vấn đề giải quyết:** User muốn dùng domain riêng thay vì subdomain
- **Người sử dụng:** User (Standard/Pro tier)
- **User Stories:**
  1. User vào Service detail → Tab “Domain”
  2. User thấy auto-generated subdomain
  3. User click “Add Custom Domain”
  4. User nhập domain (vd: [myapp.com](http://myapp.com/))
  5. Platform hiển thị DNS records cần cấu hình
  6. User cấu hình DNS → Platform verify → SSL issued
- **Acceptance Criteria:**
  - [ ] Input và validate domain format
  - [ ] Show required DNS records (CNAME hoặc A)
  - [ ] Verify domain ownership
  - [ ] Create Ingress với custom host
  - [ ] Cert-manager issue SSL certificate
- **Technical Notes:**
  - DNS verification: TXT record hoặc HTTP challenge
  - Let’s Encrypt cho production
- **Dependencies:** F04, cert-manager
- **Estimate:** 8-10 giờ

---

### F18: database-provisioning

- **Vấn đề giải quyết:** User cần database cho ứng dụng
- **Người sử dụng:** User
- **User Stories:**
  1. User vào Project → Click “Add Database”
  2. User chọn: PostgreSQL, MySQL, hoặc Redis
  3. User cấu hình: size, credentials
  4. User click Create → Database pod running
  5. Database URL tự động inject vào các services khác trong project
- **Acceptance Criteria:**
  - [ ] PostgreSQL, MySQL, Redis options
  - [ ] StatefulSet với PersistentVolume
  - [ ] Credentials stored in K8s Secret
  - [ ] DATABASE_URL env auto-injected
  - [ ] Internal-only access (không expose ra ngoài)
- **Technical Notes:**
  - Use official images: postgres:15, mysql:8.0, redis:7
  - PVC cho data persistence
- **Dependencies:** F06
- **Estimate:** 8-10 giờ

---

### F19: space-resource-overview

- **Vấn đề giải quyết:** User cần biết Space đã dùng bao nhiêu resources
- **Người sử dụng:** User, Team Admin
- **User Stories:**
  1. User vào Space detail
  2. User thấy overview: CPU used/limit, RAM used/limit
  3. User thấy breakdown theo từng Project
  4. User thấy breakdown theo từng Service
  5. Warning nếu gần hết quota
- **Acceptance Criteria:**
  - [ ] Aggregate metrics từ tất cả services trong space
  - [ ] Visual: progress bars hoặc charts
  - [ ] Breakdown table
  - [ ] Warning threshold: 80%, 90%
- **Dependencies:** F08
- **Estimate:** 5-6 giờ

---

### F20: team-collaboration

- **Vấn đề giải quyết:** Nhiều người cùng làm việc trên một Space
- **Người sử dụng:** User, Team Admin
- **User Stories:**
  1. Space owner click “Team Settings”
  2. Owner invite member bằng GitHub username
  3. Owner assign role: Admin, Developer, Viewer
  4. Member nhận invite → Accept → Access Space
  5. Permissions applied theo role
- **Acceptance Criteria:**
  - [ ] Invite by GitHub username
  - [ ] Role-based permissions:
    - Viewer: read-only
    - Developer: CRUD services, không delete space
    - Admin: full access
  - [ ] Member list với role badges
  - [ ] Remove member functionality
- **Dependencies:** F02
- **Estimate:** 8-10 giờ

---

## ADVANCED FEATURES - Ưu tiên thấp

> Tính năng nâng cao, implement nếu còn thời gian

---

### F21: auto-scaling-hpa

- **Vấn đề giải quyết:** Tự động scale dựa trên load
- **Người sử dụng:** User (Pro tier)
- **User Stories:**
  1. User enable “Auto Scaling” cho service
  2. User set: min replicas, max replicas, target CPU %
  3. Platform create HorizontalPodAutoscaler
  4. Khi load tăng → Replicas tăng tự động
  5. Khi load giảm → Replicas giảm
- **Acceptance Criteria:**
  - [ ] HPA configuration UI
  - [ ] Create/Update K8s HPA resource
  - [ ] Metrics show scaling events
  - [ ] Pro tier only
- **Dependencies:** F10
- **Estimate:** 5-6 giờ

---

### F22: scale-to-zero

- **Vấn đề giải quyết:** Tiết kiệm resources cho apps ít dùng (Free tier)
- **Người sử dụng:** User (Free tier)
- **User Stories:**
  1. Service không có request trong 30 phút
  2. Platform scale xuống 0 replicas
  3. User truy cập URL → Cold start (3-5s) → Scale lên 1
  4. Service tiếp tục hoạt động bình thường
- **Acceptance Criteria:**
  - [ ] Idle detection (30 min no traffic)
  - [ ] Scale to 0 (Deployment replicas=0)
  - [ ] Request triggers scale up
  - [ ] Cold start < 10 seconds
- **Technical Notes:**
  - Cần KEDA hoặc custom controller
  - Phức tạp, cân nhắc kỹ
- **Dependencies:** F10, KEDA
- **Estimate:** 15-20 giờ

---

### F23: service-terminal

- **Vấn đề giải quyết:** User cần exec vào container để debug
- **Người sử dụng:** User
- **User Stories:**
  1. User vào Service detail → Click “Terminal”
  2. Web terminal mở ra
  3. User có shell access vào container
  4. User có thể chạy commands
  5. Session timeout sau 30 phút
- **Acceptance Criteria:**
  - [ ] WebSocket connection cho terminal
  - [ ] kubectl exec equivalent
  - [ ] xterm.js cho UI
  - [ ] Session management
- **Technical Notes:**
  - Security consideration: chỉ allow cho owner
  - Rate limiting
- **Dependencies:** F05
- **Estimate:** 10-12 giờ

---

### F24: backup-restore

- **Vấn đề giải quyết:** User cần backup data
- **Người sử dụng:** User (Pro tier)
- **User Stories:**
  1. User vào Database service → Click “Backups”
  2. User click “Create Backup” → Backup created
  3. User thấy list backups với timestamps
  4. User click “Restore” → Confirm → Data restored
- **Acceptance Criteria:**
  - [ ] Manual backup trigger
  - [ ] Scheduled backups (daily)
  - [ ] Backup stored in PVC hoặc S3-compatible
  - [ ] Restore functionality
- **Dependencies:** F18
- **Estimate:** 12-15 giờ

---

### F25: alerting-notifications

- **Vấn đề giải quyết:** User cần biết khi có vấn đề
- **Người sử dụng:** User, Team Admin
- **User Stories:**
  1. User cấu hình alert rules (CPU > 90%, Memory > 85%)
  2. User cấu hình notification channels (Email, Discord webhook)
  3. Khi threshold exceeded → Alert triggered
  4. User nhận notification
  5. User có thể silence alerts tạm thời
- **Acceptance Criteria:**
  - [ ] Alert rule configuration UI
  - [ ] Integration với Prometheus Alertmanager
  - [ ] Email và Discord webhook support
  - [ ] Alert history
- **Dependencies:** F08
- **Estimate:** 10-12 giờ

---

### F26: activity-audit-log

- **Vấn đề giải quyết:** Tracking ai làm gì, khi nào
- **Người sử dụng:** Team Admin, Platform Admin
- **User Stories:**
  1. Admin vào “Activity Log”
  2. Admin thấy: user X created service Y at time Z
  3. Admin có thể filter by user, action type, time range
  4. Admin có thể export log
- **Acceptance Criteria:**
  - [ ] Log all CRUD actions
  - [ ] Store: who, what, when, details
  - [ ] Filterable list
  - [ ] Retention: 90 days
- **Dependencies:** F01
- **Estimate:** 6-8 giờ

---

## SUMMARY

### MVP Features (12 features):

| ID  | Feature                       | Estimate | Priority |
| --- | ----------------------------- | -------- | -------- |
| F01 | user-authentication           | 6-8h     | 🔴       |
| F02 | space-management              | 6-8h     | 🔴       |
| F03 | project-management            | 4-6h     | 🔴       |
| F04 | deploy-docker-image           | 8-10h    | 🔴       |
| F05 | service-status-view           | 4-6h     | 🔴       |
| F06 | service-environment-variables | 4-6h     | 🔴       |
| F07 | service-logs-viewer           | 4-5h     | 🔴       |
| F08 | service-metrics-dashboard     | 6-8h     | 🔴       |
| F09 | service-restart-delete        | 2-3h     | 🔴       |
| F10 | manual-scaling                | 4-5h     | 🔴       |
| F11 | platform-dashboard            | 4-6h     | 🔴       |
| F12 | user-management-admin         | 5-6h     | 🔴       |

**MVP Total: ~58-77 giờ**

### Enhanced Features (8 features):

| ID  | Feature                     | Estimate | Priority |
| --- | --------------------------- | -------- | -------- |
| F13 | scaffold-from-template      | 10-12h   | 🟡       |
| F14 | deploy-from-git-repo        | 10-12h   | 🟡       |
| F15 | auto-deploy-webhook         | 6-8h     | 🟡       |
| F16 | deployment-history-rollback | 5-6h     | 🟡       |
| F17 | custom-domain               | 8-10h    | 🟡       |
| F18 | database-provisioning       | 8-10h    | 🟡       |
| F19 | space-resource-overview     | 5-6h     | 🟡       |
| F20 | team-collaboration          | 8-10h    | 🟡       |

**Enhanced Total: ~60-74 giờ**

### Advanced Features (6 features):

| ID  | Feature                | Estimate | Priority |
| --- | ---------------------- | -------- | -------- |
| F21 | auto-scaling-hpa       | 5-6h     | 🟢       |
| F22 | scale-to-zero          | 15-20h   | 🟢       |
| F23 | service-terminal       | 10-12h   | 🟢       |
| F24 | backup-restore         | 12-15h   | 🟢       |
| F25 | alerting-notifications | 10-12h   | 🟢       |
| F26 | activity-audit-log     | 6-8h     | 🟢       |

**Advanced Total: ~58-73 giờ**

---

## DEVELOPMENT ORDER RECOMMENDATION

### Phase 1: Authentication & Core (F01-F03)

```
F01 → F02 → F03
```

**Output:** User có thể login, tạo Space, tạo Project

### Phase 2: Basic Deployment (F04-F10)

```
F04 → F05 → F06 → F07 → F08 → F09 → F10
```

**Output:** User có thể deploy Docker image, xem status/logs/metrics, scale

### Phase 3: Admin Features (F11-F12)

```
F11 → F12
```

**Output:** Platform Admin có thể quản lý hệ thống

### Phase 4: CI/CD Integration (F13-F16)

```
F13 → F14 → F15 → F16
```

**Output:** Auto deploy từ GitHub

### Phase 5: Enhanced Features (F17-F20)

```
F17 → F18 → F19 → F20
```

**Output:** Custom domain, database, team collaboration

### Phase 6: Advanced (F21-F26)

```
Làm theo thứ tự ưu tiên của project
```

---

## NOTES

1. **Estimates là rough estimates** - có thể thay đổi khi implement
2. **Mỗi feature nên có:**

   - API endpoints documented
   - Unit tests
   - Integration tests (ít nhất happy path)

3. **Definition of Done cho mỗi feature:**

   - Code complete
   - Tests pass
   - Code reviewed (self-review nếu làm một mình)
   - Deployed và test trên K3s cluster
   - Documentation updated

4. **Parallel development possible:**

   - Backend (F01-F12) có thể làm trước
   - Frontend có thể làm song song sau khi có API

5. **Sau mỗi feature:**

   - Commit với message rõ ràng
   - Tag version nếu là milestone
   - Update progress tracking

| Nhóm           | Số lượng    | Thời gian | Mục đích             |
| -------------- | ----------- | --------- | -------------------- |
| **MVP (Core)** | 12 features | ~60-77h   | Đủ để demo sản phẩm  |
| **Enhanced**   | 8 features  | ~60-74h   | Nâng cao trải nghiệm |
| **Advanced**   | 6 features  | ~58-73h   | Mở rộng sau          |

**Các thành phần của mỗi feature:**

- Vấn đề giải quyết
- Người sử dụng
- User stories chi tiết
- Acceptance criteria (checklist)
- Technical notes
- Dependencies
- Time estimate

**Thứ tự phát triển:**

1. F01-F03: Auth + Space + Project
2. F04-F10: Deploy + Status + Logs + Metrics
3. F11-F12: Admin dashboard
