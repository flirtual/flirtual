# Image variants
This is a Cloudflare Worker connected to a Queue which is triggered when a file is uploaded to an R2 bucket. If the file is a supported image, variants are generated using Image Resizing and stored in another R2 bucket. New UUIDs are generated for the normal and blurred variants so end users can't get the original files or unblur images, and these UUIDs are sent to our API to update the database.

## Setup
```
wrangler queues create pfp-upload
wrangler r2 bucket notification create pfpup --event-type object-create --queue pfp-upload
wrangler secret put ACCESS_TOKEN
pnpm install
```

## Start dev server
```
pnpm dev
```

## Deploy worker
```
pnpm deploy
```