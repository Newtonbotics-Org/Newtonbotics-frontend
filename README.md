# NewtonBotics Frontend

A modern, responsive frontend application for the NewtonBotics Robotics Lab, built with Next.js 15, React 18, and Tailwind CSS.

## 🚀 Features

### Core Application
- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **Robotics Lab Management**: Projects, workshops, events, and team management
- **Interactive 3D Elements**: Spline.js integration for engaging user experience
- **News & Updates**: Real-time news ticker and announcements
- **Gallery System**: Media management and display
- **Contact & Support**: Integrated contact forms and support system

### 🔐 Authentication System (NEW!)
- **User Registration & Login**: Complete authentication flow with JWT tokens
- **Role-based Access Control**: Student, Team Member, Mentor, Researcher, Community roles
- **Password Management**: Secure password reset and change functionality
- **Protected Routes**: Automatic route protection and redirects
- **Profile Management**: User profile completion and settings
- **Token Management**: Automatic refresh and secure storage
- **Security Features**: Input validation, XSS protection, and secure practices

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Frontend**: React 18 with TypeScript support
- **Styling**: Tailwind CSS with custom animations
- **Animations**: Framer Motion
- **3D Graphics**: Spline.js, Three.js
- **Icons**: Lucide React
- **Authentication**: Custom JWT-based system
- **State Management**: React Context API

## 📁 Project Structure

```
NewtonBoticsFrontend/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── auth/              # Authentication pages
│   │   │   ├── page.jsx       # Login/Register
│   │   │   ├── forgot/        # Forgot password
│   │   │   └── reset/         # Reset password
│   │   ├── DashBoard/         # Main dashboard
│   │   ├── ProfileCompletion/ # User profile management
│   │   └── components/        # Shared components
│   ├── lib/                   # Utility libraries
│   │   └── auth.js           # Authentication service
│   ├── contexts/              # React contexts
│   │   └── AuthContext.jsx   # Authentication context
│   ├── components/            # Reusable components
│   │   ├── ProtectedRoute.jsx # Route protection
│   │   ├── LoadingSpinner.jsx # Loading states
│   │   └── AuthErrorBoundary.jsx # Error handling
│   └── hooks/                 # Custom hooks
│       └── useAuthRedirect.js # Authentication redirects
├── public/                    # Static assets
├── components.json            # Component configuration
└── tailwind.config.mjs       # Tailwind configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NewtonBoticsFrontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and fill in your own values:
   ```bash
   cp .env.example .env
   ```

   Required:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3006/api
   NEXT_PUBLIC_SITE_URL=https://www.newtonbotics.in
   ```

   Optional (maintainers only; leave empty in public clones):
   ```
   NEXT_PUBLIC_ADMIN_URL=
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
   NEXT_PUBLIC_CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```

   Never commit `.env`. Use your own Cloudinary cloud — do not put production secrets in this repo.

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
   ```

5. **Open your browser**
   - Development: Navigate to [http://localhost:3000](http://localhost:3000)
   - Production: Visit [https://newtonbotics.tech](https://newtonbotics.tech)

## 🔐 Authentication Setup

### Backend Requirements
The authentication system requires a backend API with these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/refresh` | POST | Token refresh |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password |
| `/api/auth/me` | GET | Get current user profile |
| `/api/auth/me` | PUT | Update user profile |

### Testing the Authentication System
Visit `/auth-demo` to test the authentication functionality:
- Demo login/register/logout
- Role and permission testing
- Protected route testing
- Error handling demonstration

## 🎨 Customization

### Styling
- **Colors**: Modify `tailwind.config.mjs` for brand colors
- **Components**: Edit component files in `src/components/`
- **Pages**: Customize page layouts in `src/app/`

### Authentication
- **Roles**: Modify role definitions in `src/contexts/AuthContext.jsx`
- **Permissions**: Update permission system in the same file
- **Validation**: Adjust validation rules in `src/lib/auth.js`

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured experience with 3D elements
- **Tablet**: Optimized layout for medium screens
- **Mobile**: Touch-friendly interface with mobile-specific features

## 🔒 Security Features

- **JWT Token Management**: Secure token storage and refresh
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Proper escaping and sanitization
- **CORS Configuration**: Cross-origin request handling
- **Rate Limiting**: Ready for backend implementation

## 🧪 Testing

### Manual Testing
1. **Authentication Flow**: Test registration, login, logout
2. **Route Protection**: Verify protected routes redirect properly
3. **Role Access**: Test different user roles and permissions
4. **Error Handling**: Test various error scenarios

### Development Tools
- **Browser DevTools**: Check Network tab for API calls
- **Console Logs**: Authentication state and error logging
- **Local Storage**: Token and user data inspection

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables for Production
Set these in your host (for example Vercel), not in git:
```
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_SITE_URL=https://www.newtonbotics.in
NEXT_PUBLIC_ADMIN_URL=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). In short: fork, branch from `main`, copy `.env.example` to `.env` with your own values, then open a pull request.

## Support

1. Check environment configuration (`.env.example`)
2. Review the browser console and Network tab
3. Search existing issues, then open a new one if needed.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing framework
- **Tailwind CSS**: For the utility-first CSS framework
- **Framer Motion**: For smooth animations
- **Spline**: For 3D graphics integration
- **NewtonBotics Team**: For the robotics lab vision

---

**Note**: This is a development version. For production use, implement additional security measures like 2FA, session management, and audit logging.

