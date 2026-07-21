// Ambient declaration so `tsc` can resolve side-effect CSS imports (e.g.
// `import "@xterm/xterm/css/xterm.css"`). Vite handles the actual bundling; this
// only tells the type checker that `*.css` specifiers are valid modules.
declare module "*.css"
