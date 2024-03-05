# @feedbase-ts/client

This is the client-side library for Feedbase. It allows you to easily integrate Feedbase into your application.

## Installation

```bash
npm install @feedbase/client
```

## Usage

```typescript
import { Feedbase } from '@feedbase/client';

// Create a new Feedbase instance
const feedbase = new Feedbase(
  // The slug of your Feedbase project
  slug: 'feedbase',
  // The api key for your Feedbase project
  token: 'api-key',
);

// Submit Feedback
feedbase.submitFeedback(
  // Title
  title: 'This is a title',
  // Description
  description: 'This is a description',
  // Email
  email: 'user@email.com',
  // Full Name (optional)
  fullName: 'John Doe',
  // Avatar URL (optional)
  avatarUrl: 'https://example.com/avatar.png',
)

// Get all changelogs
feedbase.getChangelogs();
```