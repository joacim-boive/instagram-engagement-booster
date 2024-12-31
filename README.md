# Instagram Engagement Booster

This tool helps collect and analyze Instagram engagement data through the Facebook Graph API to help improve your Instagram engagement strategy.

## Prerequisites

- Node.js (v18 or higher)
- A Facebook Developer Account
- A Facebook App with Instagram Basic Display API enabled
- A Facebook Page connected to an Instagram Professional Account

## Setup

1. Clone the repository:
```bash
git clone https://github.com/joacim-boive/instagram-engagement-booster.git
cd instagram-engagement-booster
```

2. Install dependencies:
```bash
npm install
```

3. Create a Facebook App:
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app or use an existing one
   - Add "Facebook Login" product to your app
   - Under Facebook Login settings, add OAuth redirect URI:
     ```
     http://localhost:3000/auth/callback
     ```
   - Under App Settings > Basic, add to App Domains:
     ```
     localhost
     ```

4. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

5. Fill in your `.env` file with:
   - `FACEBOOK_CLIENT_ID`: Your Facebook App ID
   - `FACEBOOK_CLIENT_SECRET`: Your Facebook App Secret
   - `FACEBOOK_PAGE_ID`: Your Facebook Page ID
   - `INSTAGRAM_USER_ID`: Your Instagram username

## Usage

### Getting Access Tokens

1. Run the token refresh script:
```bash
npm run refresh-token
```

2. This will:
   - Open your browser to Facebook login
   - Request necessary permissions
   - Generate a page access token
   - Display the token in the console

3. Copy the generated token to your `.env` file as `FACEBOOK_ACCESS_TOKEN`

### Collecting Training Data

To collect Instagram engagement data:

```bash
npm run collect-data
```

This will:
- Fetch all posts from your Instagram account
- Collect comments and replies
- Save the data to `training-data.json`

The collected data includes:
- Comment content
- Author information
- Timestamps
- Reply threads

## Permissions

The app requires the following Facebook permissions:
- instagram_basic
- instagram_content_publish
- pages_read_engagement
- pages_manage_metadata
- pages_show_list
- pages_manage_engagement
- pages_manage_posts

## Error Handling

Common issues and solutions:

1. **Invalid OAuth Redirect URI**: Make sure you've added `http://localhost:3000/auth/callback` to your Facebook App's OAuth settings.

2. **Domain Not Allowed**: Add `localhost` to your App Domains in Facebook App Settings.

3. **Token Expired**: Run the refresh token script to get a new access token.

## License

MIT License - see LICENSE file for details 