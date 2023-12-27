# X (Twitter) ActivityPub Bridge
[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/kohnoselami)
![GitHub release](https://img.shields.io/github/release/c7e715d1b04b17683718fb1e8944cc28/XActivityPubBridge.svg)

Bridge to allow X (Twitter) users and posts to be viewed externally via the ActivityPub protocol

## Features
### X's API independent bridge with ActivityPub.
Using X's unofficial API and user credentials, it extracts the same data as the direct client and changes it to the ActivityPub protocol.

*(In the future, we will be able to follow you using Deno KV, but for now you can only browse.)*

It has a rate limit avoidance function and a response retention function in the cache.

- If you self-host,

**Note: We recommend that you use credentials from an X account that has already been suspended. Automation might be detected and suspended.**

## Deployment
### Tech stack
- **Deno** For a powerful backend and easy deployment

## How To Use
You can check profile by searching or mentioning "@elonmusk@x-activitypub-bridge.deno.dev".

![image](https://github.com/c7e715d1b04b17683718fb1e8944cc28/XActivityPubBridge/assets/154405627/db49c09e-aca0-4429-b729-6af846ae6b9b)

## Self Host
### Deno Deploy
**1, Fork this Repository (And Star)**

**2, Sign in to Deno Deploy to create a new project**

**3, "Create & Deploy" this repository!**

### Local
**1, Clone this Repository (And Star)**

**2, Install Deno**

**3, Go to this repository directory**

**4, Run "deno task start"!**


# License
This project is licensed under the GPL-3.0 license.