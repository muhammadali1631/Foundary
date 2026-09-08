"use client";

import { FileData, StatusStep } from "@/types/workspace";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { dracula, githubLight } from "@codesandbox/sandpack-themes";
import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AlertTriangle,
  ArrowUp,
  Bot,
  Code2,
  Download,
  Eye,
  Loader2,
  Menu,
  RefreshCw,
  X,
} from "lucide-react";
import { RingLoader } from "react-spinners";
import { Button } from "./ui/button";
import PricingModal from "./PricingModal";
import JSZip from "jszip";
import { motion, AnimatePresence } from "motion/react";

// ─── Placeholder ──────────────────────────────────────────────────────────────

const PLACEHOLDER_FILES = {
  "/App.js": {
    code: `export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
        <p style={{ fontSize: 14 }}>Your app will appear here</p>
      </div>
    </div>
  );
}`,
  },
};

// ─── Base dependencies ────────────────────────────────────────────────────────

const BASE_DEPENDENCIES: Record<string, string> = {
  "react-is": "latest",
  "react-router-dom": "latest",
  "lucide-react": "latest",
  recharts: "latest",
  "date-fns": "latest",
  "framer-motion": "latest",
  "react-hook-form": "latest",
  "@hookform/resolvers": "latest",
  zod: "latest",
  "@radix-ui/react-dialog": "latest",
  "@radix-ui/react-dropdown-menu": "latest",
  "@radix-ui/react-tabs": "latest",
  "@radix-ui/react-tooltip": "latest",
  "@radix-ui/react-accordion": "latest",
  "@radix-ui/react-select": "latest",
  axios: "latest",
  clsx: "latest",
  "class-variance-authority": "latest",
  "tailwind-merge": "latest",
};

type ActiveTab = "preview" | "code";

function SandpackInner({
  fileData,
  isGenerating,
  activeTab,
  setActiveTab,
  isImproving,
  statusLog,
  onFixError,
  isProUser,
  appTitle,
  onImprove,
}: {
  fileData: FileData | null;
  isGenerating: boolean;
  activeTab: ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
  isImproving: boolean;
  statusLog: StatusStep[];
  onFixError: (error: string) => Promise<void>;
  isProUser: boolean;
  appTitle: string | null;
  onImprove: (userRequest: string) => Promise<void>;
}) {
  const { sandpack, listen } = useSandpack();
  const prevFilesRef = useRef<Record<string, { code: string }>>(
    fileData?.files ?? {},
  );
  const [previewError, setPreviewError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const [improveInput, setImproveInput] = useState("");
  const [showImproveInput, setShowImproveInput] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleExportZip = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const filesToZip =
        Object.keys(sandpack.files).length > 0
          ? sandpack.files
          : (fileData?.files ?? {});
      const dependencies = {
        ...BASE_DEPENDENCIES,
        ...(fileData?.dependencies ?? {}),
      };
      const zip = new JSZip();
      const packageJson = {
        name: appTitle ?? "foundary-app",
        version: "1.0.0",
        private: true,
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          ...dependencies,
        },
        devDependencies: {
          "@vitejs/plugin-react": "^4.3.3",
          vite: "^5.4.10",
        },
      };
      zip.file("package.json", JSON.stringify(packageJson, null, 2));
      zip.file(
        "index.html",
        `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appTitle ?? "Foundary App"}</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
      );
      zip.file(
        "vite.config.js",
        `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
      );
      const srcEntries = Object.entries(filesToZip).filter(([filePath]) => {
        if (filePath === "/package.json") return false;
        if (filePath === "/index.html") return false;
        if (filePath === "/index.js") return false;
        if (filePath.startsWith("/.sandpack/")) return false;
        return true;
      });

      const JSX_RE = /<[A-Za-z][^>]*(>|\/>)|<>/;

      const renames = new Map<string, string>();
      for (const [filePath, fileObj] of srcEntries) {
        const fileCode =
          typeof fileObj === "object" && fileObj !== null && "code" in fileObj
            ? (fileObj as { code: string }).code
            : "";
        if (filePath.endsWith(".js") && JSX_RE.test(fileCode)) {
          renames.set(filePath, filePath.slice(0, -3) + ".jsx");
        }
      }

      const resolveRelative = (fromPath: string, spec: string) => {
        const base = fromPath.slice(0, fromPath.lastIndexOf("/") + 1);
        const parts = (base + spec).split("/");
        const stack: string[] = [];
        for (const part of parts) {
          if (part === "" || part === ".") continue;
          if (part === "..") stack.pop();
          else stack.push(part);
        }
        return "/" + stack.join("/");
      };

      const rewriteImports = (code: string, fromPath: string) =>
        code.replace(
          /(from\s+['"])(\.[^'"]*?\.js)(['"])/g,
          (_m, pre: string, spec: string, post: string) => {
            const resolved = resolveRelative(fromPath, spec);
            if (renames.has(resolved)) {
              return `${pre}${spec.replace(/\.js$/, ".jsx")}${post}`;
            }
            return `${pre}${spec}${post}`;
          },
        );

      for (const [filePath, fileObj] of srcEntries) {
        const code =
          typeof fileObj === "object" && fileObj !== null && "code" in fileObj
            ? (fileObj as { code: string }).code
            : "";

        const target = renames.get(filePath) ?? filePath;
        const zipPath = target.startsWith("/")
          ? `src${target}`
          : `src/${target}`;

        zip.file(zipPath, rewriteImports(code, filePath));
      }
      zip.file(
        "src/main.jsx",
        `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
      );

      const blob = await zip.generateAsync({type:"blob"})
       const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const zipName = appTitle
        ? `${appTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")}.zip`
        : "foundary-app.zip";
      a.download = zipName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed: ", error)
    }finally{
      setIsExporting(false)
    }
  };

  const handleReload = () => {
    if (isGenerating || isImproving) return;
    window.location.reload();
  };

  const handleImproveSubmit = async () => {
    const trimmed = improveInput.trim();
    if (!trimmed || isImproving) return;
    setImproveInput("");
    setShowImproveInput(false);
    await onImprove(trimmed);
  };

  useEffect(() => {
    unsubscribeRef.current = listen((msg) => {
      if (
        msg.type === "action" &&
        "action" in msg &&
        msg.action === "show-error"
      ) {
        const errMsg =
          "message" in msg && typeof msg.message === "string"
            ? msg.message
            : "An error occurred in the preview.";

        setPreviewError(errMsg);
        return;
      }

      if (msg.type === "compile" && "error" in msg) {
        const errMsg =
          "message" in msg && typeof msg.message === "string"
            ? msg.message
            : "Compile error in preview.";

        setPreviewError(errMsg);
        return;
      }

      // Success: clear the error
      if (msg.type === "success") {
        setPreviewError(null);
      }
    });

    return () => unsubscribeRef.current?.();
  }, [listen]);

  useEffect(() => {
    if (isGenerating) setPreviewError(null);
  }, [isGenerating]);

  useEffect(() => {
    if (!fileData?.files) return;
    const prev = prevFilesRef.current;

    for (const [path, { code }] of Object.entries(fileData.files)) {
      if (prev[path]?.code !== code) {
        sandpack.updateFile(path, code);
      }
    }
    prevFilesRef.current = fileData.files;
  }, [fileData?.files]);

  useEffect(() => {
    if (fileData) setActiveTab("preview");
  }, [fileData]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as ActiveTab)}
      className="flex min-w-0 h-full flex-col gap-0"
    >
      {/* Tabs + Actions bar */}
      <div className="relative z-50 flex min-w-0 items-center justify-between gap-3 border-b border-border/60 bg-card/50 px-3 backdrop-blur-md">
        <TabsList
          variant="line"
          className="h-auto gap-0 rounded-none bg-transparent p-0"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <TabsTrigger className="px-3 py-3 text-[13px]" value="code">
              <Code2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Code</span>
            </TabsTrigger>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <TabsTrigger className="px-3 py-3 text-[13px]" value="preview">
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </TabsTrigger>
          </motion.div>
        </TabsList>

        <div className="flex min-w-0 items-center gap-2">
          {/* ── Improve button ── */}
          {isProUser ? (
            showImproveInput ? (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-1.5 overflow-hidden"
              >
                <div className="relative flex items-center">
                  <Bot className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                  <input
                    autoFocus
                    value={improveInput}
                    onChange={(e) => setImproveInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleImproveSubmit();
                      if (e.key === "Escape") setShowImproveInput(false);
                    }}
                    placeholder="What should I improve?"
                    className="h-8 w-44 rounded-lg border border-emerald-500/30 bg-card px-3 pl-8 text-xs text-foreground shadow-sm placeholder:text-muted-foreground/40 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-500/15 focus:outline-none sm:w-56"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleImproveSubmit}
                  disabled={!improveInput.trim() || isImproving}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 transition-all duration-200 hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isImproving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ArrowUp className="h-3 w-3" />
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowImproveInput(true)}
                disabled={isImproving || !fileData}
                className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 px-3 text-xs font-medium shadow-sm transition-all duration-300 hover:border-emerald-500/40 hover:from-emerald-500/15 hover:via-teal-500/15 hover:to-teal-500/15 hover:shadow-md hover:shadow-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isImproving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                )}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text font-semibold text-transparent dark:from-emerald-400 dark:to-teal-400">
                  {isImproving ? "Improving…" : "Improve with Agent"}
                </span>
                {!isImproving && (
                  <span className="rounded-md bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-600 dark:text-emerald-300">
                    PRO
                  </span>
                )}
              </motion.button>
            )
          ) : (
            <PricingModal reason="upgrade">
              <motion.span
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 px-3 text-xs font-medium shadow-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/15"
              >
                <Bot className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text font-semibold text-transparent dark:from-emerald-400 dark:to-teal-400">
                  Improve with Agent
                </span>
                <span className="rounded-md bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-600 dark:text-emerald-300">
                  PRO
                </span>
              </motion.span>
            </PricingModal>
          )}

          {/* ── Download & Reload — inline on desktop ── */}
          <div className="hidden items-center gap-2 md:flex">
            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportZip}
                disabled={isExporting || !fileData}
                className="h-8 text-xs"
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download
              </Button>
            </motion.div>

            <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.2 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReload}
                disabled={isGenerating || isImproving || !fileData}
                title="Reload preview"
                className="h-8 px-2.5 text-xs cursor-pointer"
              >
                <RefreshCw
                  className={cn(
                    "h-3.5 w-3.5",
                    (isGenerating || isImproving) && "opacity-40",
                  )}
                />
              </Button>
            </motion.div>
          </div>

          {/* ── Hamburger menu — mobile only ── */}
          <div className="relative md:hidden">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowActions((s) => !s)}
              aria-label="More actions"
              aria-expanded={showActions}
              className={cn(
                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-all",
                showActions
                  ? "border-emerald-500/40 bg-emerald-500/10 text-foreground"
                  : "border-border/60 text-muted-foreground hover:border-emerald-500/40 hover:text-foreground",
              )}
            >
              {showActions ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <Menu className="h-3.5 w-3.5" />
              )}
            </motion.button>

            {showActions && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowActions(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-9 z-40 flex min-w-44 flex-col gap-1 rounded-xl border border-border/60 bg-card p-1.5 shadow-xl shadow-primary/10"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleExportZip();
                        setShowActions(false);
                      }}
                      disabled={isExporting || !fileData}
                      className="h-9 justify-start text-xs"
                    >
                      {isExporting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleReload();
                        setShowActions(false);
                      }}
                      disabled={isGenerating || isImproving || !fileData}
                      className="h-9 justify-start text-xs"
                    >
                      <RefreshCw
                        className={cn(
                          "h-3.5 w-3.5",
                          (isGenerating || isImproving) && "opacity-40",
                        )}
                      />
                      Reload
                    </Button>
                  </motion.div>
                </>
              )}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="relative flex-1 overflow-hidden h-full">
        <AnimatePresence>
          {(isGenerating || isImproving) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-background/85 backdrop-blur-sm"
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full bg-emerald-500/30 blur-2xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <RingLoader color="#10b981" size={64} speedMultiplier={0.8} />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-1.5"
              >
                <p className="text-sm font-medium text-foreground/70">
                  {isImproving && "Improving with Cline AI…"}
                  {isGenerating && !isImproving && "Generating your app…"}
                </p>
                <p className="text-xs text-muted-foreground/40">
                  This usually takes 10–20 seconds
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <SandpackLayout
          style={{
            height: "100vh",
            border: "none",
            borderRadius: 0,
            background: "transparent",
          }}
        >
          <TabsContent
            value="preview"
            keepMounted
            className="mt-0 h-full min-w-0 w-full"
          >
            <SandpackPreview
              style={{ height: "89%" }}
              showOpenInCodeSandbox={false}
            />
          </TabsContent>

          <TabsContent
            value="code"
            keepMounted
            className="mt-0 flex h-full min-w-0 w-full"
          >
            <div className="hidden h-full flex-none md:block">
            <SandpackFileExplorer
              style={{
                height: "90%",
                width: "180px",
                borderRight: "0.5px solid rgba(139,92,246,0.15)",
              }}
            />
          </div>
            <SandpackCodeEditor
              style={{ height: "90%", flex: 1 }}
              showTabs
              showLineNumbers
              showInlineErrors
              closableTabs
              readOnly
            />
          </TabsContent>
        </SandpackLayout>
      </div>

      {/* Preview error banner — uses onFixError (Gemini), not onImprove (Cline) */}
      <AnimatePresence>
        {previewError &&
          !isGenerating &&
          !isImproving &&
          activeTab === "preview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-x-0 -bottom-3 z-20 border-t border-red-500/20 bg-red-950/99 p-4 pb-6"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-400/70" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-red-400/80">
                    Preview error
                  </p>
                  <p className="break-all text-[11px] text-red-300/50">
                    {previewError}
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => onFixError(previewError)}
                    variant="destructive"
                    size="sm"
                    className="h-8 shrink-0"
                  >
                    <Bot className="h-3 w-3" />
                    Fix with AI
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </Tabs>
  );
}

interface CodePenalProps {
  fileData: FileData | null;
  isGenerating: boolean;
  statusLog: StatusStep[];
  onFilePatch: (patches: FileData) => void;
  isImproving: boolean;
  onFixError: (error: string) => Promise<void>;
  isProUser: boolean;
  appTitle: string | null;
  onImprove: (userRequest: string) => Promise<void>;
}

export function CodePenal({
  fileData,
  isGenerating,
  statusLog,
  onFilePatch: _onFilePatch,
  isImproving,
  onFixError,
  appTitle,
  isProUser,
  onImprove,
}: CodePenalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("preview");
  const { resolvedTheme } = useTheme();
  const sandpackTheme = resolvedTheme === "light" ? githubLight : dracula;

  const files = fileData?.files ?? PLACEHOLDER_FILES;

  const dependencies = {
    ...BASE_DEPENDENCIES,
    ...(fileData?.dependencies ?? {}),
  };

  const filePathKey = Object.keys(files).sort().join("|");

  return (
     <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SandpackProvider
        key={filePathKey}
        template="react"
        theme={dracula}
        files={files}
        customSetup={{ dependencies }}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          recompileMode: "delayed",
          recompileDelay: 500,
        }}
      >
        <SandpackInner
          isGenerating={isGenerating}
          statusLog={statusLog}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onImprove={onImprove}
          onFixError={onFixError}
          fileData={fileData}
          appTitle={appTitle}
          isImproving={isImproving}
          isProUser={isProUser}
        />
      </SandpackProvider>
    </div>
  );
}
