# Contributing to NewtonBotics Frontend

Thanks for helping improve the public NewtonBotics website.

## How to contribute

1. Fork the repository and create a branch from `main`.
2. Copy `.env.example` to `.env` and fill in your own values. Do not use production secrets.
3. Run `npm install` and `npm run dev`.
4. Make a focused change with a clear commit message.
5. Open a pull request against `main`.

## Rules

- Never commit `.env`, API secrets, tokens, or credentials.
- Do not add private server, admin-panel, or internal documentation to this repo.
- Use your own Cloudinary cloud for uploads. `CLOUDINARY_API_SECRET` stays on the server only.
- Match existing code style and include loading and error states for UI changes.

## Scope

This repository is the public website only. The backend and admin panel are private and not in scope for outside contributions.
