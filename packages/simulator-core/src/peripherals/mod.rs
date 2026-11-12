//! Peripheral implementations - WASM compatible

#[cfg(target_arch = "wasm32")]
extern crate alloc;

#[cfg(target_arch = "wasm32")]
use alloc::{vec, vec::Vec, collections::BTreeMap, string::String, string::ToString, format};
#[cfg(not(target_arch = "wasm32"))]
use std::{vec::Vec, collections::BTreeMap, string::String};

use super::{PeripheralType, PeripheralState, RegisterEntry, ConfigEntry};
use serde::{Deserialize, Serialize};

/// GPIO Port
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpioPort {
    pub port: char,
    pub pins: u8,
    pub direction: u8,
    pub output: u8,
    pub input: u8,
    pub pull_up: u8,
    pub pull_down: u8,
}

impl GpioPort {
    pub fn new(port: char, pins: u8) -> Self {
        Self {
            port,
            pins,
            direction: 0,
            output: 0,
            input: 0,
            pull_up: 0,
            pull_down: 0,
        }
    }

    pub fn set_direction(&mut self, pin: u8, output: bool) {
        if pin >= self.pins { return; }
        if output {
            self.direction |= 1 << pin;
        } else {
            self.direction &= !(1 << pin);
        }
    }

    pub fn write(&mut self, pin: u8, value: bool) {
        if pin >= self.pins { return; }
        if value {
            self.output |= 1 << pin;
        } else {
            self.output &= !(1 << pin);
        }
    }

    pub fn read(&self, pin: u8) -> bool {
        if pin >= self.pins { return false; }
        if (self.direction >> pin) & 1 == 1 {
            (self.output >> pin) & 1 == 1
        } else {
            let input_val = (self.input >> pin) & 1 == 1;
            let pull_up = (self.pull_up >> pin) & 1 == 1;
            let pull_down = (self.pull_down >> pin) & 1 == 1;
            if pull_up && !pull_down { true }
            else if pull_down && !pull_up { false }
            else { input_val }
        }
    }

    pub fn set_pull_up(&mut self, pin: u8, enable: bool) {
        if pin >= self.pins { return; }
        if enable {
            self.pull_up |= 1 << pin;
            self.pull_down &= !(1 << pin);
        } else {
            self.pull_up &= !(1 << pin);
        }
    }

    pub fn set_pull_down(&mut self, pin: u8, enable: bool) {
        if pin >= self.pins { return; }
        if enable {
            self.pull_down |= 1 << pin;
            self.pull_up &= !(1 << pin);
        } else {
            self.pull_down &= !(1 << pin);
        }
    }

    pub fn to_state(&self) -> PeripheralState {
        PeripheralState {
            peripheral_type: super::PeripheralType::Gpio,
            registers: vec![
                RegisterEntry::new(0, self.direction as u32),
                RegisterEntry::new(1, self.output as u32),
                RegisterEntry::new(2, self.input as u32),
            ],
            config: vec![
                ConfigEntry::new("port".to_string(), self.port.to_string()),
                ConfigEntry::new("pins".to_string(), self.pins.to_string()),
            ],
        }
    }
}

/// UART Peripheral
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Uart {
    pub baud_rate: u32,
    pub data_bits: u8,
    pub parity: Parity,
    pub stop_bits: u8,
    pub tx_buffer: Vec<u8>,
    pub rx_buffer: Vec<u8>,
    pub tx_enabled: bool,
    pub rx_enabled: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Parity {
    None,
    Even,
    Odd,
}

impl Uart {
    pub fn new(baud_rate: u32) -> Self {
        Self {
            baud_rate,
            data_bits: 8,
            parity: Parity::None,
            stop_bits: 1,
            tx_buffer: Vec::new(),
            rx_buffer: Vec::new(),
            tx_enabled: true,
            rx_enabled: true,
        }
    }

    pub fn write(&mut self, data: &[u8]) {
        self.tx_buffer.extend_from_slice(data);
    }

    pub fn read(&mut self, len: usize) -> Vec<u8> {
        let n = len.min(self.rx_buffer.len());
        self.rx_buffer.drain(..n).collect()
    }

    pub fn flush_tx(&mut self) -> Vec<u8> {
        core::mem::take(&mut self.tx_buffer)
    }

    pub fn push_rx(&mut self, data: &[u8]) {
        self.rx_buffer.extend_from_slice(data);
    }

    pub fn to_state(&self) -> PeripheralState {
        PeripheralState {
            peripheral_type: super::PeripheralType::Uart,
            registers: vec![
                RegisterEntry::new(0, self.baud_rate),
                RegisterEntry::new(1, self.tx_buffer.len() as u32),
                RegisterEntry::new(2, self.rx_buffer.len() as u32),
            ],
            config: vec![
                ConfigEntry::new("baud_rate".to_string(), self.baud_rate.to_string()),
                ConfigEntry::new("data_bits".to_string(), self.data_bits.to_string()),
                ConfigEntry::new("parity".to_string(), format!("{:?}", self.parity)),
                ConfigEntry::new("stop_bits".to_string(), self.stop_bits.to_string()),
            ],
        }
    }
}

/// I2C Peripheral
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct I2c {
    pub frequency: u32,
    pub address: u8,
    pub is_master: bool,
    pub tx_buffer: Vec<u8>,
    pub rx_buffer: Vec<u8>,
    pub devices: Vec<I2cDevice>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct I2cDevice {
    pub address: u8,
    pub registers: Vec<RegisterEntry>,
}

impl I2c {
    pub fn new(frequency: u32) -> Self {
        Self {
            frequency,
            address: 0,
            is_master: true,
            tx_buffer: Vec::new(),
            rx_buffer: Vec::new(),
            devices: Vec::new(),
        }
    }

    pub fn add_device(&mut self, device: I2cDevice) {
        self.devices.push(device);
    }

    pub fn master_write(&mut self, address: u8, data: &[u8]) -> Result<(), I2cError> {
        if let Some(device) = self.devices.iter_mut().find(|d| d.address == address) {
            if data.is_empty() { return Ok(()); }
            let reg = data[0];
            for (i, &byte) in data[1..].iter().enumerate() {
                let reg_addr = reg.wrapping_add(i as u8);
                if let Some(entry) = device.registers.iter_mut().find(|r| r.address == reg_addr as u32) {
                    entry.value = byte as u32;
                } else {
                    device.registers.push(RegisterEntry::new(reg_addr as u32, byte as u32));
                }
            }
            Ok(())
        } else {
            Err(I2cError::DeviceNotFound)
        }
    }

    pub fn master_read(&mut self, address: u8, len: usize) -> Result<Vec<u8>, I2cError> {
        if let Some(device) = self.devices.iter().find(|d| d.address == address) {
            let mut data = Vec::with_capacity(len);
            for i in 0..len {
                data.push(device.registers.iter().find(|r| r.address == i as u32).map(|r| r.value as u8).unwrap_or(0));
            }
            Ok(data)
        } else {
            Err(I2cError::DeviceNotFound)
        }
    }

    pub fn to_state(&self) -> PeripheralState {
        PeripheralState {
            peripheral_type: super::PeripheralType::I2c,
            registers: vec![
                RegisterEntry::new(0, self.frequency),
                RegisterEntry::new(1, self.address as u32),
            ],
            config: vec![
                ConfigEntry::new("frequency".to_string(), self.frequency.to_string()),
                ConfigEntry::new("is_master".to_string(), self.is_master.to_string()),
            ],
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum I2cError {
    DeviceNotFound,
    ArbitrationLost,
    Nack,
    Timeout,
}

/// SPI Peripheral
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Spi {
    pub frequency: u32,
    pub mode: SpiMode,
    pub bit_order: BitOrder,
    pub tx_buffer: Vec<u8>,
    pub rx_buffer: Vec<u8>,
    pub cs_pins: Vec<u8>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SpiMode {
    Mode0,
    Mode1,
    Mode2,
    Mode3,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BitOrder {
    MsbFirst,
    LsbFirst,
}

impl Spi {
    pub fn new(frequency: u32) -> Self {
        Self {
            frequency,
            mode: SpiMode::Mode0,
            bit_order: BitOrder::MsbFirst,
            tx_buffer: Vec::new(),
            rx_buffer: Vec::new(),
            cs_pins: Vec::new(),
        }
    }

    pub fn transfer(&mut self, data: &[u8]) -> Vec<u8> {
        let mut rx = Vec::with_capacity(data.len());
        for &byte in data {
            self.tx_buffer.push(byte);
            rx.push(byte);
        }
        rx
    }

    pub fn to_state(&self) -> PeripheralState {
        PeripheralState {
            peripheral_type: super::PeripheralType::Spi,
            registers: vec![
                RegisterEntry::new(0, self.frequency),
            ],
            config: vec![
                ConfigEntry::new("frequency".to_string(), self.frequency.to_string()),
                ConfigEntry::new("mode".to_string(), format!("{:?}", self.mode)),
                ConfigEntry::new("bit_order".to_string(), format!("{:?}", self.bit_order)),
            ],
        }
    }
}

/// ADC Peripheral
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Adc {
    pub resolution: u8,
    pub reference_voltage: f32,
    pub channels: Vec<AdcChannel>,
    pub sample_rate: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdcChannel {
    pub pin: u32,
    pub value: u16,
    pub enabled: bool,
}

impl Adc {
    pub fn new(resolution: u8, reference_voltage: f32) -> Self {
        Self {
            resolution,
            reference_voltage,
            channels: Vec::new(),
            sample_rate: 10000,
        }
    }

    pub fn add_channel(&mut self, channel: u32, pin: u32) {
        self.channels.push(AdcChannel { pin, value: 0, enabled: true });
    }

    pub fn read(&self, channel: u32) -> Option<u16> {
        self.channels.iter().find(|c| c.pin == channel).map(|c| c.value)
    }

    pub fn set_value(&mut self, channel: u32, value: u16) {
        if let Some(ch) = self.channels.iter_mut().find(|c| c.pin == channel) {
            let max = (1u16 << self.resolution) - 1;
            ch.value = value.min(max);
        }
    }

    pub fn voltage_to_raw(&self, voltage: f32) -> u16 {
        let max = (1u16 << self.resolution) - 1;
        ((voltage / self.reference_voltage) * max as f32) as u16
    }

    pub fn to_state(&self) -> PeripheralState {
        PeripheralState {
            peripheral_type: super::PeripheralType::Adc,
            registers: vec![
                RegisterEntry::new(0, self.resolution as u32),
                RegisterEntry::new(1, (self.reference_voltage * 1000.0) as u32),
            ],
            config: vec![
                ConfigEntry::new("resolution".to_string(), self.resolution.to_string()),
                ConfigEntry::new("reference_voltage".to_string(), self.reference_voltage.to_string()),
            ],
        }
    }
}

/// PWM Peripheral
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pwm {
    pub frequency: u32,
    pub resolution: u8,
    pub channels: Vec<PwmChannel>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PwmChannel {
    pub pin: u32,
    pub duty_cycle: u16,
    pub enabled: bool,
    pub inverted: bool,
}

impl Pwm {
    pub fn new(frequency: u32, resolution: u8) -> Self {
        Self {
            frequency,
            resolution,
            channels: Vec::new(),
        }
    }

    pub fn add_channel(&mut self, _channel: u32, pin: u32) {
        self.channels.push(PwmChannel {
            pin,
            duty_cycle: 0,
            enabled: false,
            inverted: false,
        });
    }

    pub fn set_duty(&mut self, channel: u32, duty: u16) {
        if let Some(ch) = self.channels.get_mut(channel as usize) {
            let max = (1u16 << self.resolution) - 1;
            ch.duty_cycle = duty.min(max);
        }
    }

    pub fn update(&mut self) {}

    pub fn to_state(&self) -> PeripheralState {
        PeripheralState {
            peripheral_type: super::PeripheralType::Pwm,
            registers: vec![
                RegisterEntry::new(0, self.frequency),
                RegisterEntry::new(1, self.resolution as u32),
            ],
            config: vec![
                ConfigEntry::new("frequency".to_string(), self.frequency.to_string()),
                ConfigEntry::new("resolution".to_string(), self.resolution.to_string()),
            ],
        }
    }
}

/// Timer Peripheral
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Timer {
    pub frequency: u32,
    pub period: u32,
    pub counter: u32,
    pub enabled: bool,
    pub auto_reload: bool,
    pub interrupt_enabled: bool,
}

impl Timer {
    pub fn new(frequency: u32) -> Self {
        Self {
            frequency,
            period: frequency,
            counter: 0,
            enabled: false,
            auto_reload: true,
            interrupt_enabled: false,
        }
    }

    pub fn tick(&mut self) {
        if !self.enabled { return; }
        if self.counter == 0 {
            if self.auto_reload {
                self.counter = self.period;
            } else {
                self.enabled = false;
            }
        } else {
            self.counter -= 1;
        }
    }

    pub fn start(&mut self) {
        self.enabled = true;
        self.counter = self.period;
    }

    pub fn stop(&mut self) {
        self.enabled = false;
    }

    pub fn to_state(&self) -> PeripheralState {
        PeripheralState {
            peripheral_type: super::PeripheralType::Timer,
            registers: vec![
                RegisterEntry::new(0, self.frequency),
                RegisterEntry::new(1, self.period),
                RegisterEntry::new(2, self.counter),
            ],
            config: vec![
                ConfigEntry::new("frequency".to_string(), self.frequency.to_string()),
                ConfigEntry::new("enabled".to_string(), self.enabled.to_string()),
            ],
        }
    }
}