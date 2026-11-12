//! RP2040 Architecture (ARM Cortex-M0+ dual core)

use crate::{Architecture, BoardType, CpuState};

/// ARM Cortex-M0+ CPU state (per core)
#[derive(Debug, Clone)]
pub struct CortexM0PlusState {
    pub pc: u32,
    pub sp: u32,
    pub registers: [u32; 16], // R0-R15 (R13=SP, R14=LR, R15=PC)
    pub xpsr: u32,           // xPSR (APSR, IPSR, EPSR)
    pub control: u32,        // CONTROL register
    pub cycles: u64,
    pub core_id: u32,        // 0 or 1 for dual core
}

impl CortexM0PlusState {
    pub fn new(core_id: u32) -> Self {
        Self {
            pc: 0,
            sp: 0x2004_0000, // SRAM top
            registers: [0; 16],
            xpsr: 0x0100_0000, // Thumb state bit set
            control: 0,
            cycles: 0,
            core_id,
        }
    }
}

/// RP2040 Memory Map
pub struct Rp2040Memory {
    pub bootrom: Vec<u8>,      // Boot ROM (16KB)
    pub sram0: Vec<u8>,        // SRAM Bank 0 (64KB)
    pub sram1: Vec<u8>,        // SRAM Bank 1 (64KB)
    pub sram2: Vec<u8>,        // SRAM Bank 2 (64KB)
    pub sram3: Vec<u8>,        // SRAM Bank 3 (64KB)
    pub sram4: Vec<u8>,        // SRAM Bank 4 (64KB)
    pub sram5: Vec<u8>,        // SRAM Bank 5 (64KB)
    pub flash: Vec<u8>,        // External QSPI Flash (up to 16MB)
    pub xip_cache: Vec<u8>,    // Execute-in-Place cache
}

impl Rp2040Memory {
    pub fn new(flash_size: usize) -> Self {
        Self {
            bootrom: vec![0; 16 * 1024],
            sram0: vec![0; 64 * 1024],
            sram1: vec![0; 64 * 1024],
            sram2: vec![0; 64 * 1024],
            sram3: vec![0; 64 * 1024],
            sram4: vec![0; 64 * 1024],
            sram5: vec![0; 64 * 1024],
            flash: vec![0; flash_size],
            xip_cache: vec![0; 16 * 1024],
        }
    }
}

/// RP2040 Peripheral addresses
pub mod peripheral {
    // System control
    pub const SYSCTRL_BASE: u32 = 0x4000_0000;
    pub const SYS_CLK: u32 = 0x00;
    pub const SYS_RESET: u32 = 0x04;
    pub const SYS_PLL: u32 = 0x08;
    
    // GPIO (per bank)
    pub const IO_BANK0_BASE: u32 = 0x4001_4000;
    pub const PADS_BANK0_BASE: u32 = 0x4001_C000;
    pub const IO_BANK0_GPIO0_CTRL: u32 = 0x00; // Each GPIO has 12 bytes of control
    pub const IO_BANK0_GPIO0_STATUS: u32 = 0x04;
    pub const PADS_BANK0_GPIO0: u32 = 0x00; // Each GPIO has 4 bytes of pad control
    
    // SIO (Single-cycle I/O)
    pub const SIO_BASE: u32 = 0xD000_0000;
    pub const SIO_GPIO_IN: u32 = 0x00;
    pub const SIO_GPIO_OUT: u32 = 0x04;
    pub const SIO_GPIO_OE: u32 = 0x08;
    pub const SIO_GPIO_HI: u32 = 0x0C;
    pub const SIO_GPIO_CLR: u32 = 0x10;
    pub const SIO_GPIO_XOR: u32 = 0x14;
    
    // UART0
    pub const UART0_BASE: u32 = 0x4003_4000;
    pub const UART_DR: u32 = 0x00;
    pub const UART_RSR: u32 = 0x04;
    pub const UART_FR: u32 = 0x18;
    pub const UART_ILPR: u32 = 0x20;
    pub const UART_IBRD: u32 = 0x24;
    pub const UART_FBRD: u32 = 0x28;
    pub const UART_LCR_H: u32 = 0x2C;
    pub const UART_CR: u32 = 0x30;
    pub const UART_IFLS: u32 = 0x34;
    pub const UART_IMSC: u32 = 0x38;
    pub const UART_RIS: u32 = 0x3C;
    pub const UART_MIS: u32 = 0x40;
    pub const UART_ICR: u32 = 0x44;
    pub const UART_DMACR: u32 = 0x48;
    
    // UART1
    pub const UART1_BASE: u32 = 0x4003_8000;
    
    // SPI0
    pub const SPI0_BASE: u32 = 0x4003_C000;
    pub const SPI_DR: u32 = 0x00;
    pub const SPI_SR: u32 = 0x04;
    pub const SPI_CR0: u32 = 0x08;
    pub const SPI_CR1: u32 = 0x0C;
    pub const SPI_CPSR: u32 = 0x10;
    pub const SPI_IMSC: u32 = 0x14;
    pub const SPI_RIS: u32 = 0x18;
    pub const SPI_MIS: u32 = 0x1C;
    pub const SPI_ICR: u32 = 0x20;
    pub const SPI_DMACR: u32 = 0x24;
    
    // SPI1
    pub const SPI1_BASE: u32 = 0x4004_0000;
    
    // I2C0
    pub const I2C0_BASE: u32 = 0x4004_4000;
    pub const I2C_CON: u32 = 0x00;
    pub const I2C_TAR: u32 = 0x04;
    pub const I2C_SAR: u32 = 0x08;
    pub const I2C_DATA_CMD: u32 = 0x10;
    pub const I2C_SS_SCL_HCNT: u32 = 0x14;
    pub const I2C_SS_SCL_LCNT: u32 = 0x18;
    pub const I2C_FS_SCL_HCNT: u32 = 0x1C;
    pub const I2C_FS_SCL_LCNT: u32 = 0x20;
    pub const I2C_INTR_STAT: u32 = 0x2C;
    pub const I2C_INTR_MASK: u32 = 0x30;
    pub const I2C_RAW_INTR_STAT: u32 = 0x34;
    pub const I2C_RX_TL: u32 = 0x38;
    pub const I2C_TX_TL: u32 = 0x3C;
    pub const I2C_CLR_INTR: u32 = 0x40;
    pub const I2C_CLR_RX_UNDER: u32 = 0x44;
    pub const I2C_CLR_RX_OVER: u32 = 0x48.
    pub const I2C_CLR_TX_OVER: u32 = 0x4C.
    pub const I2C_CLR_RD_REQ: u32 = 0x50.
    pub const I2C_CLR_TX_ABRT: u32 = 0x54.
    pub const I2C_CLR_RX_DONE: u32 = 0x58.
    pub const I2C_CLR_ACTIVITY: u32 = 0x5C.
    pub const I2C_CLR_STOP_DET: u32 = 0x60.
    pub const I2C_CLR_START_DET: u32 = 0x64.
    pub const I2C_CLR_GEN_CALL: u32 = 0x68.
    pub const I2C_ENABLE: u32 = 0x6C.
    pub const I2C_STATUS: u32 = 0x70.
    pub const I2C_TXFLR: u32 = 0x74.
    pub const I2C_RXFLR: u32 = 0x78.
    pub const I2C_SDA_HOLD: u32 = 0x7C.
    pub const I2C_TX_ABRT_SOURCE: u32 = 0x80.
    pub const I2C_SLV_DATA_NACK_ONLY: u32 = 0x84.
    pub const I2C_DMA_CR: u32 = 0x88.
    pub const I2C_DMA_TDLR: u32 = 0x8C.
    pub const I2C_DMA_RDLR: u32 = 0x90.
    pub const I2C_SDA_SETUP: u32 = 0x94.
    pub const I2C_ACK_GENERAL_CALL: u32 = 0x98.
    pub const I2C_ENABLE_STATUS: u32 = 0x9C.
    
    // I2C1
    pub const I2C1_BASE: u32 = 0x4004_8000.
    
    // ADC
    pub const ADC_BASE: u32 = 0x4004_C000.
    pub const ADC_CS: u32 = 0x00.
    pub const ADC_RESULT: u32 = 0x04.
    pub const ADC_FCS: u32 = 0x08.
    pub const ADC_FIFO: u32 = 0x0C.
    pub const ADC_DIV: u32 = 0x10.
    pub const ADC_INTR: u32 = 0x14.
    pub const ADC_INTE: u32 = 0x18.
    pub const ADC_INTS: u32 = 0x1C.
    
    // PWM
    pub const PWM_BASE: u32 = 0x4005_0000.
    pub const PWM_CH0_CTL: u32 = 0x00.
    pub const PWM_CH0_DIV: u32 = 0x04.
    pub const PWM_CH0_CTR: u32 = 0x08.
    pub const PWM_CH0_CC: u32 = 0x0C.
    pub const PWM_CH0_TOP: u32 = 0x10.
    pub const PWM_INTR: u32 = 0x14.
    pub const PWM_INTE: u32 = 0x18.
    pub const PWM_INTS: u32 = 0x1C.
    
    // TIMER
    pub const TIMER_BASE: u32 = 0x4005_4000.
    pub const TIMER_TIMERALARM0: u32 = 0x00.
    pub const TIMER_TIMERALARM1: u32 = 0x04.
    pub const TIMER_TIMERALARM2: u32 = 0x08.
    pub const TIMER_TIMERALARM3: u32 = 0x0C.
    pub const TIMER_TIMEHR: u32 = 0x10.
    pub const TIMER_TIMELR: u32 = 0x14.
    pub const TIMER_DBGPAUSE: u32 = 0x18.
    pub const TIMER_PAUSE: u32 = 0x1C.
    pub const TIMER_INTR: u32 = 0x20.
    pub const TIMER_INTE: u32 = 0x24.
    pub const TIMER_INTS: u32 = 0x28.
    pub const TIMER_INTF: u32 = 0x2C.
    
    // WATCHDOG
    pub const WATCHDOG_BASE: u32 = 0x4005_8000.
    pub const WATCHDOG_CTRL: u32 = 0x00.
    pub const WATCHDOG_LOAD: u32 = 0x04.
    pub const WATCHDOG_REASON: u32 = 0x08.
    pub const WATCHDOG_SCRATCH0: u32 = 0x0C.
    pub const WATCHDOG_SCRATCH1: u32 = 0x10.
    pub const WATCHDOG_SCRATCH2: u32 = 0x14.
    pub const WATCHDOG_SCRATCH3: u32 = 0x18.
    pub const WATCHDOG_SCRATCH4: u32 = 0x1C.
    pub const WATCHDOG_SCRATCH5: u32 = 0x20.
    pub const WATCHDOG_SCRATCH6: u32 = 0x24.
    pub const WATCHDOG_SCRATCH7: u32 = 0x28.
    
    // PIO (Programmable I/O)
    pub const PIO0_BASE: u32 = 0x4005_C000.
    pub const PIO1_BASE: u32 = 0x4006_0000.
    
    // USB
    pub const USB_BASE: u32 = 0x4006_4000.
    pub const USB_MAIN_CTRL: u32 = 0x00.
    pub const USB_INT_STAT: u32 = 0x04.
    pub const USB_INT_EN: u32 = 0x08.
    pub const USB_SIE_CTRL: u32 = 0x0C.
    pub const USB_SIE_STATUS: u32 = 0x10.
    pub const USB_EP_CTRL: u32 = 0x14.
    pub const USB_EP_STATUS: u32 = 0x18.
    pub const USB_EP_BUF_CTRL: u32 = 0x1C.
    pub const USB_EP_BUF_LEN: u32 = 0x20.
    pub const USB_DPRAM: u32 = 0x2000. // 8KB DPRAM
    
    // DMA
    pub const DMA_BASE: u32 = 0x4006_8000.
    pub const DMA_CH0_CTRL_TRIG: u32 = 0x00.
    pub const DMA_CH0_READ_ADDR: u32 = 0x04.
    pub const DMA_CH0_WRITE_ADDR: u32 = 0x08.
    pub const DMA_CH0_TRANS_COUNT: u32 = 0x0C.
    pub const DMA_CH0_AL1_CTRL: u32 = 0x10.
    pub const DMA_CH0_AL1_READ_ADDR: u32 = 0x14.
    pub const DMA_CH0_AL1_WRITE_ADDR: u32 = 0x18.
    pub const DMA_CH0_AL1_TRANS_COUNT: u32 = 0x1C.
    pub const DMA_CH1_CTRL_TRIG: u32 = 0x100. // Each channel 0x100 bytes
    
    // INTERRUPTS
    pub const PPB_BASE: u32 = 0xE000_0000. // ARM Private Peripheral Bus
    pub const NVIC_ISER: u32 = 0x100.
    pub const NVIC_ICER: u32 = 0x180.
    pub const NVIC_ISPR: u32 = 0x200.
    pub const NVIC_ICPR: u32 = 0x280.
    pub const NVIC_IPR: u32 = 0x400.
    
    // SYSTICK
    pub const SYSTICK_CTRL: u32 = 0x10.
    pub const SYSTICK_LOAD: u32 = 0x14.
    pub const SYSTICK_VAL: u32 = 0x18.
    pub const SYSTICK_CALIB: u32 = 0x1C.
}

/// RP2040 Interrupt numbers
pub mod interrupts {
    // Core 0 interrupts
    pub const TIMER_0_IRQ: u32 = 0;
    pub const TIMER_1_IRQ: u32 = 1;
    pub const TIMER_2_IRQ: u32 = 2;
    pub const TIMER_3_IRQ: u32 = 3;
    pub const PWM_IRQ_WRAP: u32 = 4;
    pub const USBCTRL_IRQ: u32 = 5;
    pub const XIP_IRQ: u32 = 6;
    pub const PIO0_IRQ_0: u32 = 7;
    pub const PIO0_IRQ_1: u32 = 8;
    pub const PIO1_IRQ_0: u32 = 9;
    pub const PIO1_IRQ_1: u32 = 10;
    pub const DMA_IRQ_0: u32 = 11;
    pub const DMA_IRQ_1: u32 = 12.
    pub const IO_IRQ_BANK0: u32 = 13.
    pub const IO_IRQ_QSPI: u32 = 14.
    pub const SIO_IRQ_PROC0: u32 = 15.
    pub const SIO_IRQ_PROC1: u32 = 16.
    pub const CLOCKS_IRQ: u32 = 17.
    pub const SPI0_IRQ: u32 = 18.
    pub const SPI1_IRQ: u32 = 19.
    pub const UART0_IRQ: u32 = 20.
    pub const UART1_IRQ: u32 = 21.
    pub const ADC_IRQ_FIFO: u32 = 22.
    pub const ADC_IRQ_FIFO2: u32 = 23.
    pub const I2C0_IRQ: u32 = 24.
    pub const I2C1_IRQ: u32 = 25.
    pub const RTC_IRQ: u32 = 26.
    
    // Core 1 interrupts (offset by 32)
    pub const SIO_IRQ_PROC1_BASE: u32 = 32.
}

/// PIO (Programmable I/O) state machine
pub mod pio {
    #[derive(Debug, Clone)]
    pub struct StateMachine {
        pub pc: u16,
        pub x: u32,
        pub y: u32,
        pub isr: u32,      // Input Shift Register
        pub osr: u32,      // Output Shift Register
        pub execctrl: u32,
        pub shiftctrl: u32,
        pub addr: u32,
        pub instr: u16,
        pub pinctrl: u32,
        pub div: u32,      // Clock divider
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
                div: 0x10000, // Default divider
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
            // JMP instruction
            let condition = (self.instr >> 5) & 0x1F;
            let addr = self.instr & 0x1F;
            // Simplified: always jump
            self.pc = addr as u16;
        }
        
        fn wait(&mut self) {
            // WAIT instruction
        }
        
        fn in_(&mut self) {
            // IN instruction - shift bits from pins/register into ISR
        }
        
        fn out_(&mut self) {
            // OUT instruction - shift bits from OSR to pins/register
        }
        
        fn push(&mut self) {
            // PUSH instruction - push ISR to RX FIFO
        }
        
        fn pull(&mut self) {
            // PULL instruction - pull from TX FIFO to OSR
        }
        
        fn mov(&mut self) {
            // MOV instruction - move between registers
            let dest = (self.instr >> 5) & 0xF;
            let src = self.instr & 0x1F;
        }
        
        fn irq(&mut self) {
            // IRQ instruction - set/clear IRQ flags
            self.irq = true;
        }
    }
    
    #[derive(Debug, Clone)]
    pub struct PioInstance {
        pub sm: [StateMachine; 4],
        pub instr_mem: [u16; 1024], // 1K instructions
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