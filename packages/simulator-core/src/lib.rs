//! Wokvi Simulator Core
//! Multi-architecture microcontroller simulator compiled to WebAssembly
//! Supports AVR (ATmega328P), ESP32, RP2040, and STM32

#![cfg_attr(target_arch = "wasm32", no_std)]

#[cfg(target_arch = "wasm32")]
extern crate alloc;

#[cfg(target_arch = "wasm32")]
use alloc::{vec, vec::Vec, string::String, string::ToString, collections::BTreeMap, format, boxed::Box};
#[cfg(not(target_arch = "wasm32"))]
use std::{vec::Vec, string::String, collections::BTreeMap, format, boxed::Box};

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use serde_wasm_bindgen::{to_value, from_value};

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub fn init() {
    console_log::init_with_level(log::Level::Info).ok();
    log::info!("Wokvi Simulator Core initialized");
}

pub mod arch;
pub mod peripherals;
pub mod simulation;

pub use simulation::Simulator;
pub use peripherals::{GpioPort, Uart, I2c, Spi, Adc, Pwm, Timer};

/// Main entry point for WASM
#[wasm_bindgen]
pub struct WasmSimulator {
    inner: Simulator,
}

#[wasm_bindgen]
impl WasmSimulator {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> Result<WasmSimulator, JsValue> {
        let config: SimulatorConfig = from_value(config)?;
        let simulator = Simulator::new(config);
        Ok(WasmSimulator { inner: simulator })
    }

    #[wasm_bindgen]
    pub fn step(&mut self) -> Result<JsValue, JsValue> {
        let result = self.inner.step();
        to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
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
        to_value(&results).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub fn get_state(&self) -> Result<JsValue, JsValue> {
        let state = self.inner.get_state();
        to_value(&state).map_err(|e| JsValue::from_str(&e.to_string()))
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

/// Simulator configuration - use primitives for WASM compatibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulatorConfig {
    pub architecture: Architecture,
    pub board: BoardType,
    pub frequency_hz: u32,
    pub memory_size: usize,
    pub enable_peripherals: Vec<PeripheralType>,
}

impl SimulatorConfig {
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
                Architecture::Avr => 2048,
                Architecture::Esp32 => 327_680,
                Architecture::Rp2040 => 264_000,
                Architecture::Stm32 => 196_608,
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
pub enum StepResult {
    Success,
    Halted,
    BreakpointHit(u32),
    Error(String),
}

/// CPU register state - using Vec for WASM compatibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuState {
    pub pc: u32,
    pub sp: u32,
    registers: Vec<u32>,
    pub flags: u32,
    pub cycles: u64,
}

impl CpuState {
    pub fn new() -> Self {
        Self {
            pc: 0,
            sp: 0,
            registers: vec![0; 32],
            flags: 0,
            cycles: 0,
        }
    }

    pub fn get_register(&self, index: usize) -> u32 {
        self.registers.get(index).copied().unwrap_or(0)
    }

    pub fn set_register(&mut self, index: usize, value: u32) {
        if index < self.registers.len() {
            self.registers[index] = value;
        }
    }
}

/// Full simulation state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationState {
    pub cpu: CpuState,
    memory: Vec<u8>,
    peripherals: Vec<PeripheralState>,
    gpio_state: Vec<GpioStateEntry>,
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
pub struct PeripheralState {
    pub peripheral_type: PeripheralType,
    registers: Vec<RegisterEntry>,
    config: Vec<ConfigEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterEntry {
    pub address: u32,
    pub value: u32,
}

impl RegisterEntry {
    pub fn new(address: u32, value: u32) -> Self {
        Self { address, value }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigEntry {
    pub key: String,
    pub value: String,
}

impl ConfigEntry {
    pub fn new(key: String, value: String) -> Self {
        Self { key, value }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpioStateEntry {
    pub pin_id: u32,
    pub value: bool,
}

impl GpioStateEntry {
    pub fn new(pin_id: u32, value: bool) -> Self {
        Self { pin_id, value }
    }
}