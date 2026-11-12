//! ESP32 Architecture (Xtensa LX6/LX7)

use crate::{Architecture, BoardType, CpuState};

/// ESP32 CPU state (simplified for single core)
#[derive(Debug, Clone)]
pub struct Esp32CpuState {
    pub pc: u32,
    pub sp: u32,
    pub registers: [u32; 16], // A0-A15
    pub window_base: u32,
    pub window_start: u32,
    pub ps: u32, // Processor Status
    pub cycles: u64,
}

impl Esp32CpuState {
    pub fn new() -> Self {
        Self {
            pc: 0x4000_0000, // Reset vector
            sp: 0x3FFE_0000, // Stack top
            registers: [0; 16],
            window_base: 0,
            window_start: 0,
            ps: 0x0006_0000, // Default PS
            cycles: 0,
        }
    }
}

/// ESP32 Memory Map
pub struct Esp32Memory {
    pub iram0: Vec<u8>,      // Internal RAM 0 (128KB)
    pub iram1: Vec<u8>,      // Internal RAM 1 (128KB)
    pub dram0: Vec<u8>,      // Data RAM 0 (128KB)
    pub flash: Vec<u8>,      // External Flash (up to 16MB)
    pub rtc_fast: Vec<u8>,   // RTC Fast Memory (8KB)
    pub rtc_slow: Vec<u8>,   // RTC Slow Memory (8KB)
}

impl Esp32Memory {
    pub fn new(flash_size: usize) -> Self {
        Self {
            iram0: vec![0; 128 * 1024],
            iram1: vec![0; 128 * 1024],
            dram0: vec![0; 128 * 1024],
            flash: vec![0; flash_size],
            rtc_fast: vec![0; 8 * 1024],
            rtc_slow: vec![0; 8 * 1024],
        }
    }
}

/// ESP32 Peripheral addresses
pub mod peripheral {
    // GPIO
    pub const GPIO_BASE: u32 = 0x3FF4_4000;
    pub const GPIO_OUT: u32 = 0x00;
    pub const GPIO_OUT_W1TS: u32 = 0x04;
    pub const GPIO_OUT_W1TC: u32 = 0x08;
    pub const GPIO_ENABLE: u32 = 0x0C;
    pub const GPIO_ENABLE_W1TS: u32 = 0x10;
    pub const GPIO_ENABLE_W1TC: u32 = 0x14;
    pub const GPIO_IN: u32 = 0x18;
    pub const GPIO_STATUS: u32 = 0x1C;
    pub const GPIO_STATUS_W1TS: u32 = 0x20;
    pub const GPIO_STATUS_W1TC: u32 = 0x24;
    
    // UART0
    pub const UART0_BASE: u32 = 0x3FF4_0000;
    pub const UART_FIFO: u32 = 0x00;
    pub const UART_INT_RAW: u32 = 0x04;
    pub const UART_INT_ST: u32 = 0x08;
    pub const UART_INT_ENA: u32 = 0x0C;
    pub const UART_INT_CLR: u32 = 0x10;
    pub const UART_CLKDIV: u32 = 0x14;
    pub const UART_RX_FIFO_CNT: u32 = 0x18;
    pub const UART_TX_FIFO_CNT: u32 = 0x1C;
    pub const UART_CONF0: u32 = 0x20;
    pub const UART_CONF1: u32 = 0x24;
    pub const UART_FLOW_CONF: u32 = 0x28;
    pub const UART_SLEEP_CONF: u32 = 0x2C;
    pub const UART_SWFC_CONF: u32 = 0x30;
    pub const UART_IDLE_CONF: u32 = 0x34;
    pub const UART_RS485_CONF: u32 = 0x38;
    pub const UART_AT_CMD: u32 = 0x3C;
    pub const UART_MEM_CONF: u32 = 0x40;
    pub const UART_MEM_TX_STATUS: u32 = 0x44;
    pub const UART_MEM_RX_STATUS: u32 = 0x48;
    pub const UART_MEM_CNT_STATUS: u32 = 0x4C;
    pub const UART_POS: u32 = 0x50;
    pub const UART_TXBRK: u32 = 0x54;
    pub const UART_DL1: u32 = 0x58;
    pub const UART_DL0: u32 = 0x5C;
    
    // UART1
    pub const UART1_BASE: u32 = 0x3FF5_0000;
    
    // SPI
    pub const SPI0_BASE: u32 = 0x3FF4_2000;
    pub const SPI1_BASE: u32 = 0x3FF4_3000;
    pub const SPI2_BASE: u32 = 0x3FF4_8000;
    pub const SPI3_BASE: u32 = 0x3FF4_9000;
    
    // I2C
    pub const I2C0_BASE: u32 = 0x3FF4_5000;
    pub const I2C1_BASE: u32 = 0x3FF4_6000;
    
    // LEDC (PWM)
    pub const LEDC_BASE: u32 = 0x3FF5_2000;
    
    // ADC
    pub const ADC1_BASE: u32 = 0x3FF4_8000;
    pub const ADC2_BASE: u32 = 0x3FF4_9000;
    
    // TIMER
    pub const TIMER_BASE: u32 = 0x3FF5_1000;
    
    // WIFI
    pub const WIFI_BASE: u32 = 0x3FF5_5000;
    
    // BLUETOOTH
    pub const BT_BASE: u32 = 0x3FF5_6000;
}

/// ESP32-S3 specific
pub mod s3 {
    // ESP32-S3 has USB OTG, larger memory, etc.
    pub const USB_BASE: u32 = 0x3FF5_7000;
    
    // Additional SPI
    pub const SPI3_BASE: u32 = 0x3FF4_A000;
    
    // Octal SPI
    pub const OSPI_BASE: u32 = 0x3FF5_8000;
}

/// WiFi stack simulation
pub mod wifi {
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum WifiMode {
        Station,
        SoftAP,
        StationAP,
        None,
    }
    
    #[derive(Debug, Clone)]
    pub struct WifiConfig {
        pub mode: WifiMode,
        pub ssid: String,
        pub password: String,
        pub channel: u8,
        pub auth_mode: AuthMode,
    }
    
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum AuthMode {
        Open,
        WEP,
        WPA_PSK,
        WPA2_PSK,
        WPA_WPA2_PSK,
        WPA2_ENTERPRISE,
        WPA3_PSK,
        WPA2_WPA3_PSK,
    }
    
    #[derive(Debug, Clone)]
    pub struct WifiState {
        pub mode: WifiMode,
        pub connected: bool,
        pub ip: Option<[u8; 4]>,
        pub mac: [u8; 6],
        pub rssi: i8,
        pub channel: u8,
        pub scan_results: Vec<ScanResult>,
    }
    
    #[derive(Debug, Clone)]
    pub struct ScanResult {
        pub ssid: String,
        pub bssid: [u8; 6],
        pub rssi: i8,
        pub channel: u8,
        pub auth_mode: AuthMode,
    }
    
    impl Default for WifiState {
        fn default() -> Self {
            Self {
                mode: WifiMode::None,
                connected: false,
                ip: None,
                mac: [0x24, 0x0A, 0xC4, 0x00, 0x00, 0x00],
                rssi: 0,
                channel: 0,
                scan_results: Vec::new(),
            }
        }
    }
}

/// Bluetooth stack simulation
pub mod bluetooth {
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum BleRole {
        Peripheral,
        Central,
        Broadcaster,
        Observer,
    }
    
    #[derive(Debug, Clone)]
    pub struct BleConfig {
        pub role: BleRole,
        pub device_name: String,
        pub appearance: u16,
    }
    
    #[derive(Debug, Clone)]
    pub struct BleState {
        pub role: BleRole,
        pub advertising: bool,
        pub connected: bool,
        pub connections: Vec<Connection>,
        pub services: Vec<Service>,
    }
    
    #[derive(Debug, Clone)]
    pub struct Connection {
        pub handle: u16,
        pub peer_addr: [u8; 6],
        pub interval: u16,
        pub latency: u16,
        pub timeout: u16,
    }
    
    #[derive(Debug, Clone)]
    pub struct Service {
        pub uuid: Uuid,
        pub characteristics: Vec<Characteristic>,
    }
    
    #[derive(Debug, Clone)]
    pub struct Characteristic {
        pub uuid: Uuid,
        pub properties: u8,
        pub value: Vec<u8>,
        pub descriptors: Vec<Descriptor>,
    }
    
    #[derive(Debug, Clone)]
    pub struct Descriptor {
        pub uuid: Uuid,
        pub value: Vec<u8>,
    }
    
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
    pub struct Uuid(pub [u8; 16]);
    
    impl Default for BleState {
        fn default() -> Self {
            Self {
                role: BleRole::Peripheral,
                advertising: false,
                connected: false,
                connections: Vec::new(),
                services: Vec::new(),
            }
        }
    }
}