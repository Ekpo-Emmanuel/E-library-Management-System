# Changelog

All notable changes to the Library Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Content borrowing system:
  - Database schema for borrow records with RLS policies
  - Server actions for borrowing and returning content
  - UI components for borrowing workflow
  - Content detail page with borrowing functionality
  - Borrowed items list page
  - Status indicators for content availability
- Stored procedures to bypass RLS for content operations:
  - `insert_digital_content` function for inserting content records
  - `insert_book_author` function for creating author associations
  - `insert_author` function for creating new authors
  - `borrow_item` function for borrowing content
  - `return_item` function for returning content
- RLS policies for database tables (authors, digital_content, book_authors, borrow_records)

### Fixed
- Authentication redirect error in sign-in flow
  - Replaced server-side redirect with client-side navigation
  - Updated sign-in form to manually redirect to dashboard after successful login
- Row-level security policy violations when uploading content
- Error handling improvements for authentication flows
- Better error messages for users during sign-in

## [0.1.0] - 2024-06-16

### Added
- Initial project setup with Next.js and Supabase
- User authentication system with roles (admin, librarian, student, guest)
- Email verification flow
- Password reset functionality
- Protected routes based on authentication status
- Role-based access control
- Dashboard for authenticated users
- Content upload functionality for admins and librarians
- Content management (view, update, delete)
- File storage integration with Supabase Storage
- Author and genre management
- Database schema and migrations
- UI components using shadcn/ui
- Responsive layout 