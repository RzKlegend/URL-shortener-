# shorten-da-thing

*short note from me:-
     started this project becasuse everytime I wanted to shorten a massive url to a short thing (hence the name) that can be read easily. were 1-2 websites online      that achieved this but thought of making it myself. I've also made a few changes in the original idea of the projects as follows:-
     -added a geolocation tracker, that tracks your location based on the url that you paste on the website
     -can identify you ip-address
     -can identify which device you are using, on which web-browser
     -what time you accessed the website
     just a few things I wanted to test out along with the original idea (note:- this is in no way used for malicious purposes, just a weekend project for fun)

     
shorten-da-thing is a client-powered URL shortener built with HTML, CSS, and vanilla JavaScript. It runs entirely in the browser and requires no server-side database. It features two modes of operation:
1. **Portable Mode (Zero-Database)**: Encodes and compresses URLs directly into the URL hash, making the shortened link completely portable and self-contained. Anyone who clicks the link will be automatically redirected by the client code without needing a database lookup.
2. **Local Database Mode**: Allows creating custom, readable aliases for your links. The mapping is stored locally in your browser's `localStorage` and keeps track of click analytics.

## Features
- **Two Shortening Modes**: Choose between database-free portable links or readable local aliases.
- **Click Analytics & History**: Track how many times your local short links have been clicked. Search, filter, or delete history entries.
- **Built-in QR Code Generator**: Generate and download QR codes for your shortened links instantly.
- **Deploy Ready**: Fully compatible with static hosting options like **GitHub Pages**, Vercel, Netlify, or self-hosting.

## How to Run Locally

Since shorten-da-thing is built entirely as a static client-side web application, you do not need to install any heavy dependencies (like Node.js, Python, etc.) to run it.

### Option 1: Open directly in the Browser
Simply double-click the `index.html` file on your computer to open it in Chrome, Firefox, Safari, or Edge.

### Option 2: Run a Local Server (Recommended for development)
To run a local server, you can use any static server utility. For example, if you have Node.js installed, run:
```bash
npx serve .
```
Or, if you use VS Code, you can use the **Live Server** extension.

## Deployment to GitHub Pages

shorten-da-thing is designed to be hosted for free on GitHub Pages! 

1. Create a repository on your GitHub account (e.g., `url-shortener`).
2. Push this code to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of shorten-da-thing URL Shortener"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. Go to the repository settings on GitHub, select **Pages** from the sidebar, and under **Build and deployment**, set the source to deploy from the `main` branch.
4. Your URL shortener will be live at `https://<your-username>.github.io/<your-repo-name>/`!
