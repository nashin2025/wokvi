//! Wokvi Simulator Core
//! 
//! Multi-architecture microcontroller simulator compiled to WebAssembly
//! Supports AVR (ATmega328P), ESP32, RP2040, and STM32

#![cfg_attr(target_arch = "wasm32", no_std)]

extern crate alloc;

#[cfg(target_arch = "wasm32")]
use alloc::{vec::Vec, string::String, collections::BTreeMap, format};
#[cfg(not(target_arch = "wasm32"))]
use std::{vec::Vec, string::String, collections::BTreeMap};

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub fn init() {
    console_log::init_with_level(log::Level::Info).ok();
    log::info!("Wokvi Simulator Core initialized");
}

pub mod arch;
pub mod peripherals;
pub mod simulation;

pub use simulation::{Simulator, SimulatorConfig, SimulationState, StepResult};
pub use arch::{Architecture, BoardType, CpuState};
pub use peripherals::{Peripheral, PeripheralType, GpioPort, Uart, I2c, Spi, Adc, Pwm, Timer};

/// Main entry point for WASM
#[wasm_bindgen]
pub struct WasmSimulator {
    inner: Simulator,
}

#[wasm_bindgen]
impl WasmSimulator {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> Result<WasmSimulator, JsValue> {
        let config: SimulatorConfig = serde_wasm_bindgen::from_value(config)?;
        let simulator = Simulator::new(config);
        Ok(WasmSimulator { inner: simulator })
    }

    #[wasm_bindgen]
    pub fn step(&mut self) -> Result<JsValue, JsValue> {
        let result = self.inner.step();
        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub fn run(&mut self, cycles: u64) -> Result<JsValue, JsValue> {
        let mut results = Vec::new();
        for _ in 0..cycles {
            let result = self.inner.step();
            if matches!(result, StepResult::Halted | StepResult::Error(_)) {
                break;
            }
            results.push(result);
        }
        serde_wasm_bindgen::to_value(&results).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub fn get_state(&self) -> Result<JsValue, JsValue> {
        let state = self.inner.get_state();
        serde_wasm_bindgen::to_value(&state).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub fn set_breakpoint(&mut self, address: u32) {
        self.inner.set_breakpoint(address);
    }

    #[wasm_bindgen]
    pub fn remove_breakpoint(&mut self, address: u32) {
        self.inner.remove_breakpoint(address);
    }

    #[wasm_bindgen]
    pub fn load_firmware(&mut self, firmware: Vec<u8>) -> Result<(), JsValue> {
        self.inner.load_firmware(&firmware).map_err(|e| JsValue::from_str(&e))
    }

    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.inner.reset();
    }
}

/// Architecture types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[wasm_bindgen]
pub enum Architecture {
    Avr,
    Esp32,
    Rp2040,
    Stm32,
}

/// Board types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[wasm_bindgen]
pub enum BoardType {
    ArduinoUno,
    ArduinoNano,
    Esp32Devkit,
    Esp32S3,
    RaspberryPiPico,
    Stm32Nucleo,
    Custom,
}

/// Simulator configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct SimulatorConfig {
    pub architecture: Architecture,
    pub board: BoardType,
    pub frequency_hz: u32,
    pub memory_size: usize,
    pub enable_peripherals: Vec<PeripheralType>,
}

#[wasm_bindgen]
impl SimulatorConfig {
    #[wasm_bindgen(constructor)]
    pub fn new(architecture: Architecture, board: BoardType) -> Self {
        Self {
            architecture,
            board,
            frequency_hz: match architecture {
                Architecture::Avr => 16_000_000,
                Architecture::Esp32 => 240_000_000,
                Architecture::Rp2040 => 133_000_000,
                Architecture::Stm32 => 168_000_000,
            },
            memory_size: match architecture {
                Architecture::Avr => 2048,      // 2KB SRAM
                Architecture::Esp32 => 327_680, // ~320KB SRAM
                Architecture::Rp2040 => 264_000, // 264KB SRAM
                Architecture::Stm32 => 196_608, // 192KB SRAM
            },
            enable_peripherals: vec![
                PeripheralType::Gpio,
                PeripheralType::Uart,
                PeripheralType::I2c,
                PeripheralType::Spi,
                PeripheralType::Adc,
                PeripheralType::Pwm,
                PeripheralType::Timer,
            ],
        }
    }
}

/// Peripheral types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[wasm_bindgen]
pub enum PeripheralType {
    Gpio,
    Uart,
    I2c,
    Spi,
    Adc,
    Pwm,
    Timer,
    Wifi,
    Ble,
    Usb,
    Can,
    Ethernet,
}

/// Simulation step result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub enum StepResult {
    Ok,
    Halted,
    BreakpointHit(u32),
    Error(String),
}

/// CPU register state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct CpuState {
    pub pc: u32,
    pub sp: u32,
    pub registers: Vec<u32>,
    pub flags: u32,
    pub cycles: u64,
}

/// Full simulation state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct SimulationState {
    pub cpu: CpuState,
    pub memory: Vec<u8>,
    pub peripherals: BTreeMap<String, PeripheralState>,
    pub gpio_state: BTreeMap<u32, bool>,
    pub serial_output: Vec<String>,
    pub timestamp: u64,
    pub status: SimulationStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[wasm_bindgen]
pub enum SimulationStatus {
    Stopped,
    Running,
    Paused,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct PeripheralState {
    pub peripheral_type: PeripheralType,
    pub registers: BTreeMap<u32, u32>,
    pub config: BTreeMap<String, String>,
}

/// GPIO Port
#[wasm_bindgen]
pub struct GpioPort {
    port: char,
    pins: u8,
    direction: u8,
    output: u8,
    input: u8,
}

#[wasm_bindgen]
impl GpioPort {
    #[wasm_bindgen(constructor)]
    pub fn new(port: char, pins: u8) -> Self {
        Self {
            port,
            pins,
            direction: 0,
            output: 0,
            input: 0,
        }
    }

    pub fn set_direction(&mut self, pin: u8, output: bool) {
        if output {
            self.direction |= 1 << pin;
        } else {
            self.direction &= !(1 << pin);
        }
    }

    pub fn write(&mut self, pin: u8, value: bool) {
        if value {
            self.output |= 1 << pin;
        } else {
            self.output &= !(1 << pin);
        }
    }

    pub fn read(&self, pin: u8) -> bool {
        (self.input >> pin) & 1 == 1
    }
}

/// UART peripheral
#[wasm_bindgen]
pub struct Uart {
    baud_rate: u32,
    tx_buffer: Vec<u8>,
    rx_buffer: Vec<u8>,
}

#[wasm_bindgen]
impl Uart {
    #[wasm_bindgen(constructor)]
    pub fn new(baud_rate: u32) -> Self {
        Self {
            baud_rate,
            tx_buffer: Vec::new(),
            rx_buffer: Vec::new(),
        }
    }

    pub fn write(&mut self, data: &[u8]) {
        self.tx_buffer.extend_from_slice(data);
    }

    pub fn read(&mut self, len: usize) -> Vec<u8> {
        let n = len.min(self.rx_buffer.len());
        self.rx_buffer.drain(..n).collect()
    }
}