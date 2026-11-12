//! Architecture-specific implementations

#[cfg(target_arch = "wasm32")]
extern crate alloc;

#[cfg(target_arch = "wasm32")]
use alloc::{vec, vec::Vec, string::String, collections::BTreeMap, format};
#[cfg(not(target_arch = "wasm32"))]
use std::{vec::Vec, string::String, collections::BTreeMap, format};

use serde::{Deserialize, Serialize};

/// AVR Architecture (ATmega328P)
pub mod avr {
    use super::*;

    /// AVR CPU state
    #[derive(Debug, Clone)]
    pub struct AvrCpuState {
        pub pc: u16,
        pub sp: u16,
        pub registers: [u8; 32],
        pub sreg: u8,
        pub cycles: u64,
    }

    impl AvrCpuState {
        pub fn new() -> Self {
            Self {
                pc: 0,
                sp: 0x08FF,
                registers: [0; 32],
                sreg: 0,
                cycles: 0,
            }
        }
    }

    /// AVR Memory Map
    pub struct AvrMemory {
        pub flash: Vec<u8>,
        pub sram: Vec<u8>,
        pub eeprom: Vec<u8>,
        pub io_registers: [u8; 64],
    }

    impl AvrMemory {
        pub fn new() -> Self {
            Self {
                flash: vec![0; 32 * 1024],
                sram: vec![0; 2 * 1024],
                eeprom: vec![0; 1024],
                io_registers: [0; 64],
            }
        }

        pub fn read_flash(&self, addr: u16) -> u16 {
            let idx = addr as usize * 2;
            if idx + 1 < self.flash.len() {
                u16::from_le_bytes([self.flash[idx], self.flash[idx + 1]])
            } else { 0 }
        }

        pub fn write_flash(&mut self, addr: u16, value: u16) {
            let idx = addr as usize * 2;
            if idx + 1 < self.flash.len() {
                let bytes = value.to_le_bytes();
                self.flash[idx] = bytes[0];
                self.flash[idx + 1] = bytes[1];
            }
        }
    }

    /// AVR I/O register addresses
    pub mod io {
        pub const PORTA: u8 = 0x02;
        pub const DDRA: u8 = 0x01;
        pub const PINA: u8 = 0x00;
        pub const PORTB: u8 = 0x05;
        pub const DDRB: u8 = 0x04;
        pub const PINB: u8 = 0x03;
        pub const PORTC: u8 = 0x08;
        pub const DDRC: u8 = 0x07;
        pub const PINC: u8 = 0x06;
        pub const PORTD: u8 = 0x0B;
        pub const DDRD: u8 = 0x0A;
        pub const PIND: u8 = 0x09;
        pub const UDR0: u8 = 0xC6;
        pub const UCSR0A: u8 = 0xC0;
        pub const UCSR0B: u8 = 0xC1;
        pub const UCSR0C: u8 = 0xC2;
        pub const UBRR0L: u8 = 0xC4;
        pub const UBRR0H: u8 = 0xC5;
        pub const SPDR: u8 = 0x4E;
        pub const SPSR: u8 = 0x4D;
        pub const SPCR: u8 = 0x4C;
        pub const TWDR: u8 = 0xBC;
        pub const TWAR: u8 = 0xBA;
        pub const TWSR: u8 = 0xB9;
        pub const TWCR: u8 = 0xB8;
        pub const TWBR: u8 = 0xB7;
        pub const ADCL: u8 = 0x78;
        pub const ADCH: u8 = 0x79;
        pub const ADCSRA: u8 = 0x7A;
        pub const ADCSRB: u8 = 0x7B;
        pub const ADMUX: u8 = 0x7C;
        pub const TCNT0: u8 = 0x46;
        pub const TCCR0A: u8 = 0x44;
        pub const TCCR0B: u8 = 0x45;
        pub const OCR0A: u8 = 0x47;
        pub const OCR0B: u8 = 0x48;
        pub const TCNT1L: u8 = 0x84;
        pub const TCNT1H: u8 = 0x85;
        pub const TCCR1A: u8 = 0x80;
        pub const TCCR1B: u8 = 0x81;
        pub const TCCR1C: u8 = 0x82;
        pub const OCR1AL: u8 = 0x88;
        pub const OCR1AH: u8 = 0x89;
        pub const OCR1BL: u8 = 0x8A;
        pub const OCR1BH: u8 = 0x8B;
        pub const TCNT2: u8 = 0xB2;
        pub const TCCR2A: u8 = 0xB0;
        pub const TCCR2B: u8 = 0xB1;
        pub const OCR2A: u8 = 0xB3;
        pub const OCR2B: u8 = 0xB4;
        pub const EIMSK: u8 = 0x3D;
        pub const EIFR: u8 = 0x3C;
        pub const PCICR: u8 = 0x68;
        pub const PCIFR: u8 = 0x3B;
        pub const PCMSK0: u8 = 0x6B;
        pub const PCMSK1: u8 = 0x6C;
        pub const PCMSK2: u8 = 0x6D;
        pub const WDTCSR: u8 = 0x60;
    }

    /// AVR Interrupt vectors
    pub mod interrupts {
        pub const RESET: u16 = 0x0000;
        pub const INT0: u16 = 0x0002;
        pub const INT1: u16 = 0x0004;
        pub const PCINT0: u16 = 0x0006;
        pub const PCINT1: u16 = 0x0008;
        pub const PCINT2: u16 = 0x000A;
        pub const WDT: u16 = 0x000C;
        pub const TIMER2_COMPA: u16 = 0x000E;
        pub const TIMER2_COMPB: u16 = 0x0010;
        pub const TIMER2_OVF: u16 = 0x0012;
        pub const TIMER1_CAPT: u16 = 0x0014;
        pub const TIMER1_COMPA: u16 = 0x0016;
        pub const TIMER1_COMPB: u16 = 0x0018;
        pub const TIMER1_OVF: u16 = 0x001A;
        pub const TIMER0_COMPA: u16 = 0x001C;
        pub const TIMER0_COMPB: u16 = 0x001E;
        pub const TIMER0_OVF: u16 = 0x0020;
        pub const SPI_STC: u16 = 0x0022;
        pub const USART_RX: u16 = 0x0024;
        pub const USART_UDRE: u16 = 0x0026;
        pub const USART_TX: u16 = 0x0028;
        pub const ADC: u16 = 0x002A;
        pub const EE_READY: u16 = 0x002C;
        pub const ANALOG_COMP: u16 = 0x002E;
        pub const TWI: u16 = 0x0030;
        pub const SPM_READY: u16 = 0x0032;
    }
}

/// ESP32 Architecture
pub mod esp32 {
    use super::*;

    /// ESP32 CPU state (simplified for single core)
    #[derive(Debug, Clone)]
    pub struct Esp32CpuState {
        pub pc: u32,
        pub sp: u32,
        pub registers: [u32; 16],
        pub window_base: u32,
        pub window_start: u32,
        pub ps: u32,
        pub cycles: u64,
    }

    impl Esp32CpuState {
        pub fn new() -> Self {
            Self {
                pc: 0x4000_0000,
                sp: 0x3FFE_0000,
                registers: [0; 16],
                window_base: 0,
                window_start: 0,
                ps: 0x0006_0000,
                cycles: 0,
            }
        }
    }

    /// ESP32 Peripheral addresses
    pub mod peripheral {
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
        
        pub const UART0_BASE: u32 = 0x3FF4_0000;
        pub const UART_FIFO: u32 = 0x00;
        pub const UART_INT_RAW: u32 = 0x04;
        pub const UART_INT_ST: u32 = 0x08;
        pub const UART_INT_ENA: u32 = 0x0C;
        pub const UART_INT_CLR: u32 = 0x10;
        pub const UART_CLKDIV: u32 = 0x14;
        
        pub const SPI0_BASE: u32 = 0x3FF4_2000;
        pub const SPI1_BASE: u32 = 0x3FF4_3000;
        pub const SPI2_BASE: u32 = 0x3FF4_8000;
        pub const SPI3_BASE: u32 = 0x3FF4_9000;
        
        pub const I2C0_BASE: u32 = 0x3FF4_5000;
        pub const I2C1_BASE: u32 = 0x3FF4_6000;
        
        pub const LEDC_BASE: u32 = 0x3FF5_2000;
        pub const ADC1_BASE: u32 = 0x3FF4_8000;
        pub const ADC2_BASE: u32 = 0x3FF4_9000;
        pub const TIMER_BASE: u32 = 0x3FF5_1000;
        pub const WIFI_BASE: u32 = 0x3FF5_5000;
        pub const BT_BASE: u32 = 0x3FF5_6000;
    }

    /// WiFi stack simulation
    pub mod wifi {
        use super::*;
        
        #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
        pub enum WifiMode {
            Station,
            SoftAP,
            StationAP,
            None,
        }

        #[derive(Debug, Clone, Serialize, Deserialize)]
        pub struct WifiConfig {
            pub mode: WifiMode,
            pub ssid: String,
            pub password: String,
            pub channel: u8,
            pub auth_mode: AuthMode,
        }

        #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
        pub enum AuthMode {
            Open,
            Wep,
            WpaPsk,
            Wpa2Psk,
            WpaWpa2Psk,
            Wpa2Enterprise,
            Wpa3Psk,
            Wpa2Wpa3Psk,
        }

        #[derive(Debug, Clone, Serialize, Deserialize)]
        pub struct WifiState {
            pub mode: WifiMode,
            pub connected: bool,
            pub ip: Option<[u8; 4]>,
            pub mac: [u8; 6],
            pub rssi: i8,
            pub channel: u8,
            pub scan_results: Vec<ScanResult>,
        }

        #[derive(Debug, Clone, Serialize, Deserialize)]
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
        use super::*;
        
        #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
        pub enum BleRole {
            Peripheral,
            Central,
            Broadcaster,
            Observer,
        }

        #[derive(Debug, Clone, Serialize, Deserialize)]
        pub struct BleConfig {
            pub role: BleRole,
            pub device_name: String,
            pub appearance: u16,
        }

        #[derive(Debug, Clone, Serialize, Deserialize)]
        pub struct BleState {
            pub role: BleRole,
            pub advertising: bool,
            pub connected: bool,
            pub connections: Vec<Connection>,
            pub services: Vec<Service>,
        }

        #[derive(Debug, Clone, Serialize, Deserialize)]
        pub struct Connection {
            pub handle: u16,
            pub peer_addr: [u8; 6],
            pub interval: u16,
            pub latency: u16,
            pub timeout: u16,
        }

        #[derive(Debug, Clone, Serialize, Deserialize)]
        pub struct Service {
            pub uuid: Uuid,
            pub characteristics: Vec<Characteristic>,
        }

        #[derive(Debug, Clone, Serialize, Deserialize)]
        pub struct Characteristic {
            pub uuid: Uuid,
            pub properties: u8,
            pub value: Vec<u8>,
            pub descriptors: Vec<Descriptor>,
        }

        #[derive(Debug, Clone, Serialize, Deserialize)]
        pub struct Descriptor {
            pub uuid: Uuid,
            pub value: Vec<u8>,
        }

        #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
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
}

/// RP2040 Architecture
pub mod rp2040 {
    use super::*;

    /// ARM Cortex-M0+ CPU state (per core)
    #[derive(Debug, Clone)]
    pub struct CortexM0PlusState {
        pub pc: u32,
        pub sp: u32,
        pub registers: [u32; 16],
        pub xpsr: u32,
        pub control: u32,
        pub cycles: u64,
        pub core_id: u32,
    }

    impl CortexM0PlusState {
        pub fn new(core_id: u32) -> Self {
            Self {
                pc: 0,
                sp: 0x2004_0000,
                registers: [0; 16],
                xpsr: 0x0100_0000,
                control: 0,
                cycles: 0,
                core_id,
            }
        }
    }

    /// RP2040 Peripheral addresses
    pub mod peripheral {
        pub const SYSCTRL_BASE: u32 = 0x4000_0000;
        pub const SYS_CLK: u32 = 0x00;
        pub const SYS_RESET: u32 = 0x04;
        pub const SYS_PLL: u32 = 0x08;
        
        pub const IO_BANK0_BASE: u32 = 0x4001_4000;
        pub const PADS_BANK0_BASE: u32 = 0x4001_C000;
        pub const IO_BANK0_GPIO0_CTRL: u32 = 0x00;
        pub const IO_BANK0_GPIO0_STATUS: u32 = 0x04;
        pub const PADS_BANK0_GPIO0: u32 = 0x00;
        
        pub const SIO_BASE: u32 = 0xD000_0000;
        pub const SIO_GPIO_IN: u32 = 0x00;
        pub const SIO_GPIO_OUT: u32 = 0x04;
        pub const SIO_GPIO_OE: u32 = 0x08;
        pub const SIO_GPIO_HI: u32 = 0x0C;
        pub const SIO_GPIO_CLR: u32 = 0x10;
        pub const SIO_GPIO_XOR: u32 = 0x14;
        
        pub const UART0_BASE: u32 = 0x4003_4000;
        pub const UART1_BASE: u32 = 0x4003_8000;
        pub const SPI0_BASE: u32 = 0x4003_C000;
        pub const SPI1_BASE: u32 = 0x4004_0000;
        pub const I2C0_BASE: u32 = 0x4004_4000;
        pub const I2C1_BASE: u32 = 0x4004_8000;
        pub const ADC_BASE: u32 = 0x4004_C000;
        pub const PWM_BASE: u32 = 0x4005_0000;
        pub const TIMER_BASE: u32 = 0x4005_4000;
        pub const WATCHDOG_BASE: u32 = 0x4005_8000;
        pub const PIO0_BASE: u32 = 0x4005_C000;
        pub const PIO1_BASE: u32 = 0x4006_0000;
        pub const USB_BASE: u32 = 0x4006_4000;
        pub const DMA_BASE: u32 = 0x4006_8000;
    }

    /// PIO state machine
    pub mod pio {
        use super::*;
        
        #[derive(Debug, Clone)]
        pub struct StateMachine {
            pub pc: u16,
            pub x: u32,
            pub y: u32,
            pub isr: u32,
            pub osr: u32,
            pub execctrl: u32,
            pub shiftctrl: u32,
            pub addr: u32,
            pub instr: u16,
            pub pinctrl: u32,
            pub div: u32,
            pub running: bool,
            pub irq: bool,
        }

        impl StateMachine {
            pub fn new() -> Self {
                Self {
                    pc: 0,
                    x: 0,
                    y: 0,
                    isr: 0,
                    osr: 0,
                    execctrl: 0,
                    shiftctrl: 0,
                    addr: 0,
                    instr: 0,
                    pinctrl: 0,
                    div: 0x10000,
                    running: false,
                    irq: false,
                }
            }

            pub fn step(&mut self, instruction_memory: &[u16]) {
                if !self.running { return; }
                if self.pc as usize >= instruction_memory.len() {
                    self.pc = 0;
                }
                self.instr = instruction_memory[self.pc as usize];
                self.execute();
                self.pc = self.pc.wrapping_add(1);
            }

            fn execute(&mut self) {
                let opcode = self.instr >> 13;
                match opcode {
                    0b000 => self.jmp(),
                    0b001 => self.wait(),
                    0b010 => self.in_(),
                    0b011 => self.out_(),
                    0b100 => self.push(),
                    0b101 => self.pull(),
                    0b110 => self.mov(),
                    0b111 => self.irq(),
                    _ => {}
                }
            }

            fn jmp(&mut self) {
                let addr = self.instr & 0x1F;
                self.pc = addr as u16;
            }
            fn wait(&mut self) {}
            fn in_(&mut self) {}
            fn out_(&mut self) {}
            fn push(&mut self) {}
            fn pull(&mut self) {}
            fn mov(&mut self) {}
            fn irq(&mut self) { self.irq = true; }
        }

        #[derive(Debug, Clone)]
        pub struct PioInstance {
            pub sm: [StateMachine; 4],
            pub instr_mem: [u16; 1024],
            pub irq: u32,
            pub ctrl: u32,
            pub fstat: u32,
            pub flevel: u32,
            pub fdebug: u32,
        }

        impl PioInstance {
            pub fn new() -> Self {
                Self {
                    sm: core::array::from_fn(|_| StateMachine::new()),
                    instr_mem: [0; 1024],
                    irq: 0,
                    ctrl: 0,
                    fstat: 0,
                    flevel: 0,
                    fdebug: 0,
                }
            }
        }
    }
}

/// STM32 Architecture (Cortex-M4)
pub mod stm32 {
    use super::*;

    #[derive(Debug, Clone)]
    pub struct CortexM4State {
        pub pc: u32,
        pub sp: u32,
        pub registers: [u32; 16],
        pub xpsr: u32,
        pub control: u32,
        pub fpscr: u32,
        pub cycles: u64,
    }

    impl CortexM4State {
        pub fn new() -> Self {
            Self {
                pc: 0,
                sp: 0x2000_0000,
                registers: [0; 16],
                xpsr: 0x0100_0000,
                control: 0,
                fpscr: 0,
                cycles: 0,
            }
        }
    }

    pub mod peripheral {
        pub const GPIO_BASE: u32 = 0x4002_0000;
        pub const USART1_BASE: u32 = 0x4001_1000;
        pub const SPI1_BASE: u32 = 0x4001_3000;
        pub const I2C1_BASE: u32 = 0x4000_5400;
        pub const ADC1_BASE: u32 = 0x4001_2400;
        pub const TIM1_BASE: u32 = 0x4001_0000;
        pub const RCC_BASE: u32 = 0x4002_3800;
    }
}