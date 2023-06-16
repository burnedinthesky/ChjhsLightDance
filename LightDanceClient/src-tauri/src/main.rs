// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::process::Command;
// use tauri::PathResolver;

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

#[tauri::command]
fn open_file_browser(path: String) {
    open::that_in_background(path);
}

#[tauri::command]
fn get_fragment_length(handle: tauri::AppHandle, fragpath: String) -> String {
    let resource_pathbuf = handle.path_resolver().resource_dir();
    let resource_path: String = resource_pathbuf
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let executable_path = if cfg!(target_os = "windows") {
        format!("{}/resources/py-win/cal_length.exe", resource_path)
    } else if cfg!(target_os = "macos") {
        format!("{}/resources/py-mac/cal_length", resource_path)
    } else {
        return "Unsupported OS".to_string();
    };

    let output = Command::new(executable_path)
        .arg(fragpath)
        .output()
        .expect("failed to execute process");
    let stdout = String::from_utf8(output.stdout).unwrap();
    let stderr = String::from_utf8(output.stderr).unwrap();

    println!("stdout: {}", stdout);
    println!("stderr: {}", stderr);

    format! {"{};;;{}", stdout, stderr}
}

#[tauri::command]
fn compile_final_dance(handle: tauri::AppHandle, excels: String, startfrom: i32) -> String {
    let resource_path: String = handle
        .path_resolver()
        .resource_dir()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let app_data_dir = handle
        .path_resolver()
        .app_data_dir()
        .unwrap()
        .to_string_lossy()
        .to_string();

    let board_config_path = format!("{}/board_configs.json", app_data_dir);

    let executable_path = if cfg!(target_os = "windows") {
        format!("{}/resources/py-win/compile_dance.exe", resource_path)
    } else if cfg!(target_os = "macos") {
        format!("{}/resources/py-mac/compile_dance", resource_path)
    } else {
        return "Unsupported OS".to_string();
    };

    let output = Command::new(executable_path)
        .arg(board_config_path)
        .arg(excels)
        .arg(startfrom.to_string())
        .output()
        .expect("failed to execute process");
    let stdout = String::from_utf8(output.stdout).unwrap();
    let stderr = String::from_utf8(output.stderr).unwrap();

    println!("stdout: {}", stdout);
    println!("stderr: {}", stderr);

    format! {"{};;;{}", stdout, stderr}
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_lan_ip,
            open_file_browser,
            get_fragment_length,
            compile_final_dance
        ])
        // .setup(|app| {
        //     let resource_path: String = app
        //         .handle()
        //         .path_resolver()
        //         .resource_dir()
        //         .unwrap_or_default()
        //         .to_string_lossy()
        //         .to_string();
        //     Command::new("node")
        //         .arg(format!("{}/resources/bridger/bundle.cjs", resource_path))
        //         .arg(format!("{}/resources/bridger/.env", resource_path))
        //         .spawn()
        //         .expect("Failed to run script");
        //     Ok(())
        // })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
