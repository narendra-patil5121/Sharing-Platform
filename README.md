# 🚀 Akatsuki’s Draft: AI-Enabled Content Sharing Platform (Backend)

A robust Node.js/Express REST API backend for **Akatsuki’s Draft**, built with a strict **Test-Driven Development (TDD)** methodology using **Jest** and **Supertest**. The platform enables secure user authentication, role-based content lifecycle management, admin moderation, and Google Gemini AI content enhancement.

---

## 🛠️ Tech Stack & Configurations

- **Runtime**: Node.js & Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with Bearer token header
- **Password Security**: Bcrypt (`bcryptjs`) with automated pre-save Mongoose middleware
- **AI Integration**: Google Gemini API (`@google/generative-ai`)
- **Testing**: Jest & Supertest with `mongodb-memory-server` for isolated integration testing

---

## 🗄️ Database Schemas

### 1. User Schema (`src/models/User.js`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `name` | String | Required, Trim | User's full display name |
| `email` | String | Required, Unique, Lowercase, Regex validated | User's unique email address |
| `password` | String | Required, Min length 6 | Hashed using bcrypt pre-save middleware (excluded from JSON outputs) |
| `role` | String | Enum: `["admin", "user"]`, Default: `"user"` | Authorization role |

### 2. Post Schema (`src/models/Post.js`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `title` | String | Required, Trim | Title of the post or draft |
| `description` | String | Required, Trim | Short summary or subtitle |
| `content` | String | Required | Main body content |
| `image` | String | Optional (URL/file path) | Header/cover image |
| `category` | String | Required, Trim | Content category |
| `createdBy` | ObjectId | Ref: `User`, Required | Creator of the post |
| `status` | String | Enum: `["draft", "pending", "approved", "rejected"]`, Default: `"draft"` | Moderation status |
| `createdAt` | Date | Default: `Date.now` | Post timestamp |

---

## 🧪 Test Suites & API Routes

### Suite A: Authentication (`/auth`)
| Route | Method | Access | Description | Status Code |
|---|---|---|---|---|
| `/auth/register` | `POST` | Public | Registers a new user with hashed password | `201 Created` / `400 Bad Request` |
| `/auth/login` | `POST` | Public | Validates credentials and returns JWT token | `200 OK` / `401 Unauthorized` |
| `/auth/me` | `GET` | Protected | Returns decoded logged-in user profile (excluding password) | `200 OK` / `401 Unauthorized` |

### Suite B: User Post Management (`/posts`)
| Route | Method | Access | Description | Status Code |
|---|---|---|---|---|
| `/posts` | `POST` | Protected (`user`, `admin`) | Creates new post/draft with default status `"draft"` | `201 Created` |
| `/posts` | `GET` | Public | Returns only posts where `status: "approved"` | `200 OK` |
| `/posts/:id` | `GET` | Public | Returns an approved post by ID | `200 OK` / `404 Not Found` |
| `/posts/my-posts` | `GET` | Protected (`user`, `admin`) | Returns all posts and drafts belonging exclusively to the requester | `200 OK` |
| `/posts/:id` | `PATCH` | Protected (Owner Only) | Updates allowed fields (`title`, `description`, `content`, etc.) | `200 OK` / `403 Forbidden` / `404 Not Found` |
| `/posts/:id` | `DELETE` | Protected (Owner Only) | Deletes post owned by requester | `200 OK` / `403 Forbidden` / `404 Not Found` |

### Suite C: Admin Management (`/admin/posts`)
| Route | Method | Access | Description | Status Code |
|---|---|---|---|---|
| `/admin/posts/pending` | `GET` | Protected (`admin` Only) | Returns all posts where `status: "pending"` | `200 OK` / `403 Forbidden` |
| `/admin/posts/approve/:id` | `PATCH` | Protected (`admin` Only) | Sets post status to `"approved"` | `200 OK` / `403 Forbidden` / `404 Not Found` |
| `/admin/posts/reject/:id` | `PATCH` | Protected (`admin` Only) | Sets post status to `"rejected"` | `200 OK` / `403 Forbidden` / `404 Not Found` |

### Suite D: AI Integration (`/ai`)
| Route | Method | Access | Description | Status Code |
|---|---|---|---|---|
| `/ai/improve/:postId` | `POST` | Protected (Owner Only) | Refines content with Google Gemini API, saving the enhanced version as a brand new draft with a new unique ID under the same owner, while leaving the original post completely intact | `201 Created` / `403 Forbidden` / `404 Not Found` |

---

## 🏃 Getting Started

### 1. Environment Configuration
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Configuration variables:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/akatsuki_draft
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_google_gemini_api_key
```

### 2. Running Tests (TDD Suite)
Run all 29 automated tests across all 4 suites:
```bash
npm test
```

Run test suite with code coverage:
```bash
npm run test:coverage
```

### 3. Starting the Server
```bash
# Production start
npm start

# Development mode (with live watch)
npm run dev
```
Server will be accessible at `http://localhost:5000` with health check available at `GET /health`.

