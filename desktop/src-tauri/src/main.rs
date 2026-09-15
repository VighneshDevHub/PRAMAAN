// Prevents extra console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::Manager;

// ── Shared state ─────────────────────────────────────────────────────────────

struct AppState {
    backend: Mutex<Option<Child>>,
    frontend: Mutex<Option<Child>>,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn repo_root() -> PathBuf {
    // desktop/src-tauri/ → desktop/ → PRAMAAN/
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf()
}

/// Poll a TCP address until it accepts connections or we time out.
fn wait_for_port(host_port: &str, max_secs: u64) -> bool {
    for _ in 0..(max_secs * 4) {
        if std::net::TcpStream::connect(host_port).is_ok() {
            return true;
        }
        thread::sleep(Duration::from_millis(250));
    }
    false
}

fn npm_cmd() -> &'static str {
    if cfg!(target_os = "windows") { "npm.cmd" } else { "npm" }
}

// ── Tauri commands ────────────────────────────────────────────────────────────

#[tauri::command]
fn get_backend_url() -> String {
    "http://localhost:8000".to_string()
}

// ── Main ──────────────────────────────────────────────────────────────────────

fn main() {
    // ── In DEBUG (dev) mode: servers are already running manually.
    //    In RELEASE mode: spawn them here.
    // ─────────────────────────────────────────────────────────────
    let is_release = !cfg!(debug_assertions);

    let root = repo_root();
    let backend_dir = root.join("backend");
    let frontend_dir = root.join("frontend");

    let backend_child: Option<Child>;
    let frontend_child: Option<Child>;

    if is_release {
        // RELEASE — spawn backend
        println!("[pramaan] Starting backend...");
        backend_child = Some(
            Command::new("python")
                .args(["-m", "uvicorn", "app.main:app",
                       "--host", "127.0.0.1", "--port", "8000",
                       "--log-level", "warning"])
                .current_dir(&backend_dir)
                .spawn()
                .expect("Failed to start backend. Is Python in PATH?"),
        );

        // RELEASE — serve Next.js production build (requires npm run build first)
        println!("[pramaan] Starting frontend (production server)...");
        frontend_child = Some(
            Command::new(npm_cmd())
                .args(["run", "start"])
                .env("PORT", "3000")
                .current_dir(&frontend_dir)
                .spawn()
                .expect("Failed to start frontend. Is npm in PATH?"),
        );

        // Wait for both to be ready
        println!("[pramaan] Waiting for backend on :8000...");
        wait_for_port("127.0.0.1:8000", 30);
        println!("[pramaan] Waiting for frontend on :3000...");
        wait_for_port("127.0.0.1:3000", 60);
        println!("[pramaan] Both servers ready.");
    } else {
        // DEV — servers already running manually, nothing to spawn
        backend_child = None;
        frontend_child = None;
        println!("[pramaan] Dev mode — using externally started servers.");
    }

    tauri::Builder::default()
        .manage(AppState {
            backend: Mutex::new(backend_child),
            frontend: Mutex::new(frontend_child),
        })
        .invoke_handler(tauri::generate_handler![get_backend_url])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                let app = window.app_handle();
                let state = app.state::<AppState>();

                if let Ok(mut g) = state.backend.lock() {
                    if let Some(mut c) = g.take() {
                        let _ = c.kill();
                        println!("[pramaan] Backend stopped.");
                    }
                };

                if let Ok(mut g) = state.frontend.lock() {
                    if let Some(mut c) = g.take() {
                        let _ = c.kill();
                        println!("[pramaan] Frontend stopped.");
                    }
                };
            }
        })
        .run(tauri::generate_context!())
        .expect("Error running PRAMAAN desktop app");
}
