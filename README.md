# Campus Lost & Found Portal with Live Alerts

A complete Full Stack MERN application engineered for college campuses to streamline reporting, searching, claiming, verifying, and recovering lost and found belongings in real time.

---

## Academic Modules Division

### Member 1: Student Registration, Login, Authentication & Profile Management
- **Frontend Pages**: `Login.jsx`, `Register.jsx`, `Profile.jsx`
- **Backend**: `authController.js`, `authRoutes.js`, `User.js` model
- **Features**: JWT-based session security, Bcrypt password encryption, role control (`student` / `admin`), profile details editing (Name, Phone, Roll Number), and secure password update.

### Member 2: Report Lost Item, Report Found Item & Image Upload
- **Frontend Pages**: `ReportItem.jsx` (handles `/report-lost` and `/report-found`)
- **Backend**: `itemController.js` (`reportLost`, `reportFound`), `upload.js` (Multer), `files.js`
- **Features**: Multipart form submission with category picker, location, date, contact info, and image upload with instant client preview and size validation (max 5MB).

### Member 3: Search Items, Category Filters & Item Details
- **Frontend Pages**: `Search.jsx`, `ItemDetails.jsx`, `MyReports.jsx`
- **Backend**: `searchController.js` (`searchItems`, `getMeta`, `getRecovered`), `itemController.js` (`getItemById`, `getMyItems`, `updateItem`, `deleteItem`)
- **Features**: Debounced text search (title, description, location), type filters (`All`, `Lost`, `Found`), category filter chips, status badges, pagination, rich item details view, and student report management.

### Member 4: Secure Ownership Verification, Claim Requests & Recovery Workflow
- **Frontend**: Claim modal in `ItemDetails.jsx`, Claim review card in `MyReports.jsx`
- **Backend**: `claimController.js`, `claimRoutes.js`, `Claim.js` model
- **Features**: Secure claim filing requiring detailed proof description and unique secret identifiers (serial number, private marks). The reporter reviews claims and can approve or reject them with feedback notes. Approving a claim automatically marks the item as recovered.

### Member 5: Email Notifications, In-App Notifications & Live Alerts
- **Frontend**: `SocketContext.jsx`, `NotificationBell.jsx`, live toast alert banners
- **Backend**: `socket.js` (Socket.IO rooms), `notify.js`, `email.js` (Nodemailer), `notificationController.js`
- **Features**: Real-time Socket.IO broadcasts for new reports and status changes, instant floating toast alerts, bell icon with unread badge counter, notification drawer, automated email alerts for matching reports, and claim decision emails.

### Member 6: Admin Dashboard, Report Verification, Moderation & Status Management
- **Frontend**: `AdminDashboard.jsx` (protected by `<ProtectedRoute adminOnly>`)
- **Backend**: `adminController.js`, `adminRoutes.js`, `createAdmin.js` CLI
- **Features**: Campus statistics overview (total items, pending, verified, recovered, users), reports moderation queue with quick verify, status updates, removal with student notification reason, hard-delete capability, and registered user directory.

### Member 7: Frontend Design, Responsive Layout, Integration, Testing & Documentation
- **Frontend**: Luggage-tag neobrutalist aesthetic in `index.css`, `Layout.jsx`, `Navbar.jsx`, responsive mobile drawer
- **Testing**: End-to-end integration test suite `backend/tests/smoke.js` covering 35 assertions across all 6 core modules with 100% pass rate.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, React Router DOM 6, Axios, Socket.IO Client, Custom CSS Tokens |
| **Backend** | Node.js, Express.js 4, Socket.IO 4, Multer, Nodemailer, JWT, BcryptJS |
| **Database** | MongoDB (Mongoose 8) with text indexes and timestamp tracking |

---

## How to Run the Project

### 1. Prerequisites
- Node.js (v18+)
- MongoDB service running on `mongodb://127.0.0.1:27017`

### 2. Backend Setup
```bash
cd backend
npm install
node scripts/createAdmin.js admin@campus.edu Admin@12345 "Campus Admin"
npm start
```
*Backend runs on `http://localhost:5000`.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` with reverse proxy to `http://localhost:5000`.*

### 4. Running the Smoke Test Suite
```bash
cd backend
npm run test:smoke
```
*(Runs 35 automated integration checks validating Auth, Reporting, Search, Claims, Notifications, and Admin features).*
