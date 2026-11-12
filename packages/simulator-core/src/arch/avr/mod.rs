//! AVR Architecture (ATmega328P)

use crate::{Architecture, BoardType, CpuState};

/// AVR CPU state
#[derive(Debug, Clone)]
pub struct AvrCpuState {
    pub pc: u16,           // Program Counter (16-bit)
    pub sp: u16,           // Stack Pointer
    pub registers: [u8; 32], // R0-R31
    pub sreg: u8,          // Status Register
    pub cycles: u64,
}

impl AvrCpuState {
    pub fn new() -> Self {
        Self {
            pc: 0,
            sp: 0x08FF, // RAMEND for ATmega328P
            registers: [0; 32],
            sreg: 0,
            cycles: 0,
        }
    }
}

/// AVR Memory Map
pub struct AvrMemory {
    pub flash: Vec<u8>,      // Program memory (32KB)
    pub sram: Vec<u8>,       // Data memory (2KB)
    pub eeprom: Vec<u8>,     // EEPROM (1KB)
    pub io_registers: [u8; 64], // I/O registers
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

/// AVR Peripheral addresses
pub mod io {
    // GPIO Ports
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
    
    // USART0
    pub const UDR0: u8 = 0xC6;
    pub const UCSR0A: u8 = 0xC0;
    pub const UCSR0B: u8 = 0xC1;
    pub const UCSR0C: u8 = 0xC2;
    pub const UBRR0L: u8 = 0xC4;
    pub const UBRR0H: u8 = 0xC5;
    
    // SPI
    pub const SPDR: u8 = 0x4E;
    pub const SPSR: u8 = 0x4D;
    pub const SPCR: u8 = 0x4C;
    
    // TWI (I2C)
    pub const TWDR: u8 = 0xBC;
    pub const TWAR: u8 = 0xBA;
    pub const TWSR: u8 = 0xB9;
    pub const TWCR: u8 = 0xB8;
    pub const TWBR: u8 = 0xB7;
    pub const TWSR: u8 = 0xB9;
    
    // ADC
    pub const ADCL: u8 = 0x78;
    pub const ADCH: u8 = 0x79;
    pub const ADCSRA: u8 = 0x7A;
    pub const ADCSRB: u8 = 0x7B;
    pub const ADMUX: u8 = 0x7C;
    
    // Timer/Counter 0
    pub const TCNT0: u8 = 0x46;
    pub const TCCR0A: u8 = 0x44;
    pub const TCCR0B: u8 = 0x45;
    pub const OCR0A: u8 = 0x47;
    pub const OCR0B: u8 = 0x48;
    
    // Timer/Counter 1
    pub const TCNT1L: u8 = 0x84;
    pub const TCNT1H: u8 = 0x85;
    pub const TCCR1A: u8 = 0x80;
    pub const TCCR1B: u8 = 0x81;
    pub const TCCR1C: u8 = 0x82;
    pub const OCR1AL: u8 = 0x88;
    pub const OCR1AH: u8 = 0x89;
    pub const OCR1BL: u8 = 0x8A;
    pub const OCR1BH: u8 = 0x8B;
    
    // Timer/Counter 2
    pub const TCNT2: u8 = 0xB2;
    pub const TCCR2A: u8 = 0xB0;
    pub const TCCR2B: u8 = 0xB1;
    pub const OCR2A: u8 = 0xB3;
    pub const OCR2B: u8 = 0xB4;
    
    // Interrupts
    pub const EIMSK: u8 = 0x3D;
    pub const EIFR: u8 = 0x3C;
    pub const PCICR: u8 = 0x68;
    pub const PCIFR: u8 = 0x3B;
    pub const PCMSK0: u8 = 0x6B;
    pub const PCMSK1: u8 = 0x6C;
    pub const PCMSK2: u8 = 0x6D;
    
    // Watchdog
    pub const WDTCSR: u8 = 0x60;
}

/// AVR Instruction set (simplified)
pub mod instructions {
    use crate::avr::AvrCpuState;
    
    pub fn execute(cpu: &mut AvrCpuState, opcode: u16) -> u32 {
        // Simplified instruction execution
        // Returns cycles taken
        
        let high = (opcode >> 8) as u8;
        let low = opcode as u8;
        
        // Decode basic instruction groups
        match high {
            0x00..=0x0F => {
                // NOP, MOV, LDI, etc.
                1
            }
            0x10..=0x1F => {
                // ALU operations
                1
            }
            0x20..=0x2F => {
                // Branch instructions
                1
            }
            0x30..=0x3F => {
                // Load/Store
                2
            }
            0x40..=0x4F => {
                // JMP/CALL
                3
            }
            0x50..=0x5F => {
                // ALU with immediate
                1
            }
            0x60..=0x6F => {
                // Bit operations
                1
            }
            0x70..=0x7F => {
                // I/O operations
                1
            }
            0x80..=0x8F => {
                // 16-bit operations
                1
            }
            0x90..=0x9F => {
                // Stack operations
                2
            }
            0xA0..=0xAF => {
                // Multiplication
                2
            }
            0xB0..=0xBF => {
                // Branch conditional
                1
            }
            0xC0..=0xCF => {
                // Special instructions
                1
            }
            0xD0..=0xDF => {
                // RCALL/RJMP
                3
            }
            0xE0..=0xEF => {
                // LDI
                1
            }
            0xF0..=0xFF => {
                // Branch/Call
                2
            }
        }
    }
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