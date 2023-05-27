// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_lan_ip() -> String {
    let ifaces = get_if_addrs::get_if_addrs().unwrap();
    let mut ip = String::new();

    for iface in ifaces {
        if let get_if_addrs::IfAddr::V4(ref ifv4) = iface.addr {
            if !ifv4.is_loopback() {
                ip = ifv4.ip.to_string();
                break;
            }
        }
    }
    ip
}

// #[tauri::command]
// async fn open_explorer(path: String) -> tauri::Result<()> {

// }

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![get_lan_ip])
        // .invoke_handler(tauri::generate_handler![open_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}