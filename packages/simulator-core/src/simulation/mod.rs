//! Core simulation engine

#[cfg(target_arch = "wasm32")]
extern crate alloc;

#[cfg(target_arch = "wasm32")]
use alloc::{vec, vec::Vec, string::String, string::ToString, collections::BTreeMap, format, boxed::Box};
#[cfg(not(target_arch = "wasm32"))]
use std::{vec::Vec, string::String, collections::BTreeMap, format, boxed::Box};

use super::{Architecture, BoardType, CpuState, PeripheralState, PeripheralType, RegisterEntry, ConfigEntry, SimulatorConfig, SimulationState, SimulationStatus, StepResult, GpioStateEntry};
use crate::peripherals::{GpioPort, Uart, I2c, Spi, Adc, Pwm, Timer};

/// Main simulator struct
pub struct Simulator {
    config: SimulatorConfig,
    cpu: CpuState,
    memory: Vec<u8>,
    gpio_ports: BTreeMap<char, GpioPort>,
    uarts: BTreeMap<u32, Uart>,
    i2c_buses: BTreeMap<u32, I2c>,
    spi_buses: BTreeMap<u32, Spi>,
    adc_channels: BTreeMap<u32, Adc>,
    pwm_channels: BTreeMap<u32, Pwm>,
    timers: BTreeMap<u32, Timer>,
    breakpoints: BTreeMap<u32, bool>,
    cycles: u64,
    status: SimulationStatus,
    serial_output: Vec<String>,
    firmware_loaded: bool,
}

impl Simulator {
    pub fn new(config: SimulatorConfig) -> Self {
        let memory_size = config.memory_size;
        let mut simulator = Self {
            config,
            cpu: CpuState::new(),
            memory: vec![0; memory_size],
            gpio_ports: BTreeMap::new(),
            uarts: BTreeMap::new(),
            i2c_buses: BTreeMap::new(),
            spi_buses: BTreeMap::new(),
            adc_channels: BTreeMap::new(),
            pwm_channels: BTreeMap::new(),
            timers: BTreeMap::new(),
            breakpoints: BTreeMap::new(),
            cycles: 0,
            status: SimulationStatus::Stopped,
            serial_output: Vec::new(),
            firmware_loaded: false,
        };

        simulator.init_peripherals();
        simulator
    }

    fn init_peripherals(&mut self) {
        match self.config.architecture {
            Architecture::Avr => {
                for port in ['A', 'B', 'C', 'D', 'E', 'F', 'G'] {
                    self.gpio_ports.insert(port, GpioPort::new(port, 8));
                }
            }
            Architecture::Esp32 => {
                for i in 0..40 {
                    if let Some(ch) = char::from_u32(i as u32) {
                        self.gpio_ports.insert(ch, GpioPort::new(ch, 1));
                    }
                }
            }
            Architecture::Rp2040 => {
                for i in 0..30 {
                    if let Some(ch) = char::from_u32(i as u32) {
                        self.gpio_ports.insert(ch, GpioPort::new(ch, 1));
                    }
                }
            }
            Architecture::Stm32 => {
                for port in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] {
                    self.gpio_ports.insert(port, GpioPort::new(port, 16));
                }
            }
        }

        self.uarts.insert(0, Uart::new(115200));
        self.i2c_buses.insert(0, I2c::new(100_000));
        self.spi_buses.insert(0, Spi::new(1_000_000));
    }

    pub fn step(&mut self) -> StepResult {
        if self.status != SimulationStatus::Running {
            return StepResult::Success;
        }

        if self.breakpoints.get(&self.cpu.pc).copied().unwrap_or(false) {
            return StepResult::BreakpointHit(self.cpu.pc);
        }

        if !self.firmware_loaded {
            return StepResult::Error("No firmware loaded".to_string());
        }

        self.execute_instruction();
        self.cycles += 1;
        self.cpu.cycles = self.cycles;

        self.update_peripherals();

        StepResult::Success
    }

    fn execute_instruction(&mut self) {
        self.cpu.pc = self.cpu.pc.wrapping_add(2);
        if self.cpu.pc >= self.memory.len() as u32 {
            self.cpu.pc = 0;
        }
    }

    fn update_peripherals(&mut self) {
        for timer in self.timers.values_mut() {
            timer.tick();
        }

        for pwm in self.pwm_channels.values_mut() {
            pwm.update();
        }

        for uart in self.uarts.values_mut() {
            while !uart.tx_buffer.is_empty() {
                if let Some(byte) = uart.tx_buffer.pop() {
                    self.serial_output.push(format!("{:02X}", byte));
                }
            }
        }
    }

    pub fn get_state(&self) -> SimulationState {
        let mut gpio_state = Vec::new();
        for (port, gpio) in &self.gpio_ports {
            for pin in 0..gpio.pins {
                let port_char = *port;
                let pin_id = (port_char as u32) << 8 | pin as u32;
                let value = (gpio.output >> pin) & 1 == 1;
                gpio_state.push(GpioStateEntry::new(pin_id, value));
            }
        }

        let mut peripherals = Vec::new();
        for gpio in self.gpio_ports.values() {
            peripherals.push(gpio.to_state());
        }
        for uart in self.uarts.values() {
            peripherals.push(uart.to_state());
        }
        for i2c in self.i2c_buses.values() {
            peripherals.push(i2c.to_state());
        }
        for spi in self.spi_buses.values() {
            peripherals.push(spi.to_state());
        }
        for adc in self.adc_channels.values() {
            peripherals.push(adc.to_state());
        }
        for pwm in self.pwm_channels.values() {
            peripherals.push(pwm.to_state());
        }
        for timer in self.timers.values() {
            peripherals.push(timer.to_state());
        }

        SimulationState {
            cpu: self.cpu.clone(),
            memory: self.memory.clone(),
            peripherals,
            gpio_state,
            serial_output: self.serial_output.clone(),
            timestamp: self.cycles,
            status: self.status,
        }
    }

    pub fn set_breakpoint(&mut self, address: u32) {
        self.breakpoints.insert(address, true);
    }

    pub fn remove_breakpoint(&mut self, address: u32) {
        self.breakpoints.remove(&address);
    }

    pub fn load_firmware(&mut self, firmware: &[u8]) -> Result<(), String> {
        if firmware.len() > self.memory.len() {
            return Err("Firmware too large for memory".to_string());
        }
        self.memory[..firmware.len()].copy_from_slice(firmware);
        self.cpu.pc = 0;
        self.cpu.sp = self.memory.len() as u32;
        self.firmware_loaded = true;
        self.status = SimulationStatus::Stopped;
        Ok(())
    }

    pub fn reset(&mut self) {
        self.cpu = CpuState::new();
        self.cycles = 0;
        self.status = SimulationStatus::Stopped;
        self.serial_output.clear();
        self.firmware_loaded = false;
        for gpio in self.gpio_ports.values_mut() {
            gpio.direction = 0;
            gpio.output = 0;
        }
        for uart in self.uarts.values_mut() {
            uart.tx_buffer.clear();
            uart.rx_buffer.clear();
        }
    }

    pub fn run(&mut self) {
        self.status = SimulationStatus::Running;
    }

    pub fn pause(&mut self) {
        self.status = SimulationStatus::Paused;
    }

    pub fn stop(&mut self) {
        self.status = SimulationStatus::Stopped;
    }
}