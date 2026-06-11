/** Minimal static 404 page served by edge middleware for unknown routes. */
export const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>404 — Page Not Found | MPB Health</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb; color: #111827; }
    main { text-align: center; padding: 2rem; max-width: 28rem; }
    h1 { font-size: 3rem; margin: 0 0 0.5rem; }
    p { color: #4b5563; margin: 0 0 1.5rem; line-height: 1.5; }
    a { color: #0284c7; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <main>
    <h1>404</h1>
    <p>The page you are looking for does not exist or has been moved.</p>
    <a href="/">Return to MPB Health home</a>
  </main>
</body>
</html>`;
