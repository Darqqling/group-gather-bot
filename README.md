
# Telegram Bot Collection Manager

## Project info

**URL**: https://lovable.dev/projects/d29d3bab-2b62-4a86-945c-71e53817796b

## Recent fixes (May 3, 2025)

We resolved several critical issues with the Telegram bot integration:

1. Created a secure `app_secrets` table in the database for storing sensitive information like the Telegram bot token
2. Updated the edge functions (`update-telegram-token`, `setup-telegram-webhook`, `telegram-webhook`) to properly retrieve the token from the database
3. Fixed UI components to handle token updates and webhook configuration
4. Resolved issues with token storage and retrieval using proper upsert operations with conflict handling

These changes enable the bot to successfully:
- Register with the Telegram API
- Receive and respond to basic commands
- Process user interactions

## Known limitations

The bot currently has some functional limitations that need to be addressed:

1. New collection creation flow is incomplete - the bot doesn't properly handle the input of collection names after the `/new` command
2. Command naming inconsistencies between the admin interface and bot implementation
3. Some callback queries may cause errors due to improper UUID validation

## How to use the bot

1. Configure your bot token in the admin panel:
   - Go to Settings > API Keys
   - Enter your Telegram bot token
   - Save the token

2. Set up the webhook:
   - Go to Settings > Bot Settings
   - Click "Setup Webhook" to connect Telegram to your bot
   - Verify the webhook status shows "Active"

3. Test basic commands:
   - `/start` - Introduction message
   - `/new` - Start creating a new collection
   - `/history` - View past collections

## How to edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d29d3bab-2b62-4a86-945c-71e53817796b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (for backend functionality and edge functions)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d29d3bab-2b62-4a86-945c-71e53817796b) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
