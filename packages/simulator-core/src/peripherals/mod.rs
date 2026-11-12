//! Peripheral implementations

use alloc::{vec::Vec, collections::BTreeMap, string::String};
use super::{PeripheralType, PeripheralState};

/// GPIO Port
pub struct GpioPort {
    pub port: char,
    pub pins: u8,
    pub direction: u8, // 1 = output, 0 = input
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
            // Output mode - return output value
            (self.output >> pin) & 1 == 1
        } else {
            // Input mode - return input value (with pull-up/down)
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
}

/// UART Peripheral
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
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
}

/// I2C Peripheral
pub struct I2c {
    pub frequency: u32,
    pub address: u8,
    pub is_master: bool,
    pub tx_buffer: Vec<u8>,
    pub rx_buffer: Vec<u8>,
    pub devices: BTreeMap<u8, I2cDevice>,
}

#[derive(Debug, Clone)]
pub struct I2cDevice {
    pub address: u8,
    pub registers: BTreeMap<u8, u8>,
    pub on_read: Option<fn(u8) -> u8>,
    pub on_write: Option<fn(u8, u8)>,
}

impl I2c {
    pub fn new(frequency: u32) -> Self {
        Self {
            frequency,
            address: 0,
            is_master: true,
            tx_buffer: Vec::new(),
            rx_buffer: Vec::new(),
            devices: BTreeMap::new(),
        }
    }

    pub fn add_device(&mut self, device: I2cDevice) {
        self.devices.insert(device.address, device);
    }

    pub fn master_write(&mut self, address: u8, data: &[u8]) -> Result<(), I2cError> {
        if let Some(device) = self.devices.get_mut(&address) {
            if data.is_empty() { return Ok(()); }
            
            let reg = data[0];
            for &byte in &data[1..] {
                device.registers.insert(reg, byte);
                reg = reg.wrapping_add(1);
            }
            Ok(())
        } else {
            Err(I2cError::DeviceNotFound)
        }
    }

    pub fn master_read(&mut self, address: u8, len: usize) -> Result<Vec<u8>, I2cError> {
        if let Some(device) = self.devices.get(&address) {
            let mut data = Vec::with_capacity(len);
            // Simplified: read from register 0 onwards
            for i in 0..len {
                data.push(*device.registers.get(&(i as u8)).unwrap_or(&0));
            }
            Ok(data)
        } else {
            Err(I2cError::DeviceNotFound)
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum I2cError {
    DeviceNotFound,
    ArbitrationLost,
    Nack,
    Timeout,
}

/// SPI Peripheral
pub struct Spi {
    pub frequency: u32,
    pub mode: SpiMode,
    pub bit_order: BitOrder,
    pub tx_buffer: Vec<u8>,
    pub rx_buffer: Vec<u8>,
    pub cs_pins: Vec<u8>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SpiMode {
    Mode0, // CPOL=0, CPHA=0
    Mode1, // CPOL=0, CPHA=1
    Mode2, // CPOL=1, CPHA=0
    Mode3, // CPOL=1, CPHA=1
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
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
            // Simplified: echo back for loopback
            rx.push(byte);
        }
        rx
    }
}

/// ADC Peripheral
pub struct Adc {
    pub resolution: u8, // bits
    pub reference_voltage: f32,
    pub channels: BTreeMap<u32, AdcChannel>,
    pub sample_rate: u32,
}

#[derive(Debug, Clone)]
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
            channels: BTreeMap::new(),
            sample_rate: 10000,
        }
    }

    pub fn add_channel(&mut self, channel: u32, pin: u32) {
        self.channels.insert(channel, AdcChannel { pin, value: 0, enabled: true });
    }

    pub fn read(&self, channel: u32) -> Option<u16> {
        self.channels.get(&channel).map(|c| c.value)
    }

    pub fn set_value(&mut self, channel: u32, value: u16) {
        if let Some(ch) = self.channels.get_mut(&channel) {
            let max = (1u16 << self.resolution) - 1;
            ch.value = value.min(max);
        }
    }

    pub fn voltage_to_raw(&self, voltage: f32) -> u16 {
        let max = (1u16 << self.resolution) - 1;
        ((voltage / self.reference_voltage) * max as f32) as u16
    }
}

/// PWM Peripheral
pub struct Pwm {
    pub frequency: u32,
    pub resolution: u8,
    pub channels: BTreeMap<u32, PwmChannel>,
}

#[derive(Debug, Clone)]
pub struct PwmChannel {
    pub pin: u32,
    pub duty_cycle: u16, // 0 to (2^resolution - 1)
    pub enabled: bool,
    pub inverted: bool,
}

impl Pwm {
    pub fn new(frequency: u32, resolution: u8) -> Self {
        Self {
            frequency,
            resolution,
            channels: BTreeMap::new(),
        }
    }

    pub fn add_channel(&mut self, channel: u32, pin: u32) {
        self.channels.insert(channel, PwmChannel {
            pin,
            duty_cycle: 0,
            enabled: false,
            inverted: false,
        });
    }

    pub fn set_duty(&mut self, channel: u32, duty: u16) {
        if let Some(ch) = self.channels.get_mut(&channel) {
            let max = (1u16 << self.resolution) - 1;
            ch.duty_cycle = duty.min(max);
        }
    }

    pub fn update(&mut self) {
        // In real implementation, this would update hardware registers
        // For simulation, we just track the state
    }
}

/// Timer Peripheral
pub struct Timer {
    pub frequency: u32,
    pub period: u32,
    pub counter: u32,
    pub enabled: bool,
    pub auto_reload: bool,
    pub interrupt_enabled: bool,
    pub callback: Option<fn()>,
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
            callback: None,
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
            
            if self.interrupt_enabled {
                if let Some(cb) = self.callback {
                    cb();
                }
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
}