import { useState } from 'react';
import { useProjectStore, useUIStore } from '../store';
import { ArrowRight, ArrowLeft, Check, ChevronDown, Cpu, Thermometer, Zap, Monitor, Wifi, Battery, GitBranch, Package, Plus, X, Search } from 'lucide-react';
import { cn } from '../utils/cn';

const steps = [
  { id: 'board', title: 'Select Board', icon: Cpu, description: 'Choose your microcontroller' },
  { id: 'components', title: 'Add Components', icon: Package, description: 'Pick sensors, displays, actuators' },
  { id: 'wiring', title: 'Wire It Up', icon: Zap, description: 'AI-assisted breadboard wiring' },
  { id: 'code', title: 'Generate Code', icon: Zap, description: 'AI generates firmware' },
  { id: 'simulate', title: 'Simulate', icon: Monitor, description: 'Run and test your project' },
];

const boards = [
  { id: 'esp32-devkit', name: 'ESP32 DevKit V1', chip: 'ESP32-WROOM-32', pins: 38, features: ['WiFi', 'Bluetooth', '240MHz'] },
  { id: 'esp32-s3', name: 'ESP32-S3 DevKit', chip: 'ESP32-S3', pins: 45, features: ['WiFi', 'Bluetooth 5', 'USB OTG', '240MHz'] },
  { id: 'arduino-uno', name: 'Arduino Uno R3', chip: 'ATmega328P', pins: 20, features: ['16MHz', 'Classic', 'Beginner-friendly'] },
  { id: 'arduino-nano', name: 'Arduino Nano', chip: 'ATmega328P', pins: 22, features: ['16MHz', 'Breadboard-friendly', 'Compact'] },
  { id: 'raspberry-pi-pico', name: 'Raspberry Pi Pico', chip: 'RP2040', pins: 26, features: ['Dual-core', '133MHz', 'Low cost'] },
  { id: 'stm32-nucleo', name: 'STM32 Nucleo', chip: 'STM32F4', pins: 50, features: ['Cortex-M4', '168MHz', 'Professional'] },
];

const componentCategories = [
  { id: 'sensor', label: 'Sensors', icon: Thermometer, items: ['BME280 (Temp/Humidity/Pressure)', 'DHT22 (Temp/Humidity)', 'MPU6050 (Accel/Gyro)', 'HC-SR04 (Ultrasonic)', 'PIR Motion Sensor', 'Soil Moisture Sensor'] },
  { id: 'display', label: 'Displays', icon: Monitor, items: ['SSD1306 OLED 128x64', 'ST7789 TFT 240x240', 'ILI9341 TFT 320x240', 'E-Paper 2.13"', 'TM1637 4-Digit', 'MAX7219 Matrix'] },
  { id: 'actuator', label: 'Actuators', icon: Motor, items: ['SG90 Servo', '28BYJ-48 Stepper', 'DC Motor + L298N', 'Relay Module', 'Buzzer', 'Vibration Motor'] },
  { id: 'communication', label: 'Communication', icon: Wifi, items: ['ESP32 WiFi/BLE (Built-in)', 'NRF24L01 Radio', 'LoRa SX1276', 'SIM800L GSM', 'CAN Bus MCP2515', 'RS485 Module'] },
  { id: 'power', label: 'Power', icon: Battery, items: ['TP4056 LiPo Charger', 'LM2596 Buck Converter', 'AMS1117 3.3V Reg', 'Solar Panel 5V', 'Battery Holder 18650', 'USB-C PD Trigger'] },
  { id: 'passive', label: 'Passive', icon: Resistor, items: ['Resistor Kit', 'Capacitor Kit', 'Push Buttons', 'Potentiometer 10k', 'Slide Switch', 'Jumper Wires'] },
];

export function GuidedMode() {
  const { currentProject, setMode, updateProject } = useProjectStore();
  const { setBottomPanelOpen, setActiveBottomTab } = useUIStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBoard, setSelectedBoard] = useState<string>('esp32-devkit');
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'board': return !!selectedBoard;
      case 'components': return selectedComponents.length > 0;
      case 'wiring': return true; // AI will handle
      case 'code': return true; // AI will handle
      case 'simulate': return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    // Generate project from selections
    const project = {
      id: crypto.randomUUID(),
      name: 'Guided Project',
      mode: 'guided' as const,
      board: selectedBoard,
      components: selectedComponents.map((id, i) => ({
        id: crypto.randomUUID(),
        componentId: id,
        position: { x: 100 + i * 120, y: 200 },
        rotation: 0 as const,
        properties: {},
      })),
      wires: [],
      code: `// Generated for ${boards.find(b => b.id === selectedBoard)?.name}\n// Components: ${selectedComponents.join(', ')}\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  delay(100);\n}`,
      simulationConfig: {
        board: selectedBoard as any,
        frequency: 240_000_000,
        peripherals: [],
        virtualSensors: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: '',
      collaborators: [],
      isPublic: false,
      tags: ['guided'],
    };
    updateProject(project);
    setBottomPanelOpen(true);
    setActiveBottomTab('terminal');
  };

  const StepContent = () => {
    switch (steps[currentStep].id) {
      case 'board': return <BoardSelectionStep selectedBoard={selectedBoard} onSelect={setSelectedBoard} />;
      case 'components': return <ComponentSelectionStep selectedComponents={selectedComponents} onChange={setSelectedComponents} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
      case 'wiring': return <WiringStep />;
      case 'code': return <CodeGenerationStep />;
      case 'simulate': return <SimulationStep onFinish={handleFinish} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress Header */}
      <div className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                Guided Project Builder
              </h2>
              <p className="text-sm text-surface-500">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
              </p>
            </div>
            <button onClick={() => setMode('magic')} className="btn-ghost text-sm">
              Switch to Magic Mode
            </button>
          </div>

          <div className="flex items-center gap-2">
            {steps.map((step, i) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      i < currentStep
                        ? 'bg-green-600 text-white'
                        : i === currentStep
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
                    )}
                  >
                    {i < currentStep ? <Check className="h-4 w-4" /> : <span>{i + 1}</span>}
                  </div>
                  {i < currentStep && (
                    <div className="w-16 h-0.5 bg-green-600 dark:bg-green-500" />
                  )}
                  {i === currentStep && i < steps.length - 1 && (
                    <div className="w-16 h-0.5 bg-primary-600 dark:bg-primary-500" />
                  )}
                </div>
                {i === steps.length - 1 && (
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                      currentStep === i ? 'bg-primary-600 text-white' : 'bg-surface-200 dark:bg-surface-700 text-surface-500'
                    )}
                  >
                    {steps.length}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 max-w-4xl mx-auto w-full p-6 overflow-y-auto">
          <StepContent />
        </div>

        {/* Step Sidebar */}
        <aside className="hidden lg:block w-72 border-l border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 p-4 overflow-y-auto">
          <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-4">Steps</h3>
          <nav className="space-y-2">
            {steps.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(i)}
                disabled={i > currentStep && !canProceed()}
                className={cn(
                  'w-full text-left p-3 rounded-lg text-sm transition-all',
                  i === currentStep
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : i < currentStep
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0',
                      i < currentStep ? 'bg-green-600 text-white' : i === currentStep ? 'bg-primary-600 text-white' : 'bg-surface-200 dark:bg-surface-700 text-surface-500'
                    )}
                  >
                    {i < currentStep ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
                  </div>
                  <div>
                    <div className="font-medium">{step.title}</div>
                    <div className="text-xs text-surface-500">{step.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </aside>
      </div>

      {/* Navigation */}
      <div className="border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="btn-secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <div className="flex items-center gap-2">
            {currentStep === steps.length - 1 ? (
              <button onClick={handleFinish} disabled={!canProceed()} className="btn-primary">
                Finish & Simulate
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button onClick={handleNext} disabled={!canProceed()} className="btn-primary">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BoardSelectionStep({ selectedBoard, onSelect }: { selectedBoard: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-surface-600 dark:text-surface-400">
        Choose your microcontroller board. The ESP32 DevKit is recommended for most projects
        with built-in WiFi and Bluetooth.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => onSelect(board.id)}
            className={cn(
              'card p-4 text-left transition-all border-2',
              selectedBoard === board.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'hover:border-primary-300 dark:hover:border-primary-700'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                <Microchip className="h-6 w-6 text-surface-600 dark:text-surface-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-surface-900 dark:text-surface-100 truncate">{board.name}</h4>
                <p className="text-sm text-surface-500 dark:text-surface-400">{board.chip}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {board.features.map((f) => (
                    <span key={f} className="px-2 py-0.5 text-xs rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ComponentSelectionStep({
  selectedComponents,
  onChange,
  searchQuery,
  setSearchQuery,
}: {
  selectedComponents: string[];
  onChange: (ids: string[]) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredCategories = componentCategories.filter((cat) =>
    cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.items.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleComponent = (component: string) => {
    onChange(
      selectedComponents.includes(component)
        ? selectedComponents.filter((c) => c !== component)
        : [...selectedComponents, component]
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-9"
        />
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredCategories.map((category) => (
          <div key={category.id} className="card overflow-hidden">
            <button
              onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
              className="w-full p-3 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800"
            >
              <div className="flex items-center gap-2">
                <category.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span className="font-medium text-surface-900 dark:text-surface-100">{category.label}</span>
                <span className="text-xs text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded">
                  {category.items.length}
                </span>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-surface-400 transition-transform', expandedCategory === category.id && 'rotate-180')} />
            </button>

            {expandedCategory === category.id && (
              <div className="border-t border-surface-200 dark:border-surface-700 p-3 space-y-2 max-h-60 overflow-y-auto">
                {category.items.map((item) => {
                  const isSelected = selectedComponents.includes(item);
                  return (
                    <label key={item} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleComponent(item)}
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-surface-700 dark:text-surface-300">{item}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedComponents.length > 0 && (
        <div className="card p-3 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-primary-700 dark:text-primary-400">
              Selected ({selectedComponents.length})
            </span>
            <button
              onClick={() => onChange([])}
              className="text-xs text-primary-600 hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedComponents.map((comp) => (
              <span key={comp} className="px-2 py-1 text-xs rounded bg-white dark:bg-surface-800 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                {comp}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WiringStep() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-6">
        <Zap className="h-8 w-8 text-primary-600 dark:text-primary-400" />
      </div>
      <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
        AI-Assisted Wiring
      </h3>
      <p className="text-surface-600 dark:text-surface-400 max-w-md mx-auto mb-6">
        Our AI will automatically generate the optimal breadboard wiring for your selected components.
        It considers pin conflicts, power requirements, and signal integrity.
      </p>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 card">
          <div className="text-2xl font-bold text-primary-600">0</div>
          <div className="text-sm text-surface-500">Pin Conflicts</div>
        </div>
        <div className="p-4 card">
          <div className="text-2xl font-bold text-green-600">✓</div>
          <div className="text-sm text-surface-500">Power Rails</div>
        </div>
        <div className="p-4 card">
          <div className="text-2xl font-bold text-blue-600">Auto</div>
          <div className="text-sm text-surface-500">Routing</div>
        </div>
      </div>
    </div>
  );
}

function CodeGenerationStep() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-6">
        <Zap className="h-8 w-8 text-primary-600 dark:text-primary-400" />
      </div>
      <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
        AI Code Generation
      </h3>
      <p className="text-surface-600 dark:text-surface-400 max-w-md mx-auto mb-6">
        Based on your board and components, AI will generate complete, compilable firmware with
        proper library initialization, pin definitions, and main loop logic.
      </p>
      <div className="card p-6 max-w-2xl mx-auto text-left">
        <pre className="bg-surface-900 text-surface-100 p-4 rounded-lg overflow-x-auto text-sm">
{`// Generated firmware preview
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <Adafruit_SSD1306.h>

#define BME280_ADDR 0x76
#define OLED_ADDR 0x3C

Adafruit_BME280 bme;
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Serial.begin(115200);
  Wire.begin();
  
  if (!bme.begin(BME280_ADDR)) {
    Serial.println("BME280 not found!");
  }
  
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("OLED not found!");
  }
  display.clearDisplay();
  display.display();
}

void loop() {
  float temp = bme.readTemperature();
  float hum = bme.readHumidity();
  float press = bme.readPressure() / 100.0F;
  
  display.clearDisplay();
  display.setCursor(0, 0);
  display.printf("Temp: %.1f C", temp);
  display.setCursor(0, 16);
  display.printf("Hum: %.1f %%", hum);
  display.setCursor(0, 32);
  display.printf("Press: %.1f hPa", press);
  display.display();
  
  delay(2000);
}`}
        </pre>
      </div>
    </div>
  );
}

function SimulationStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
        <Monitor className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
        Ready to Simulate
      </h3>
      <p className="text-surface-600 dark:text-surface-400 max-w-md mx-auto mb-6">
        Your project is configured and ready. Click "Finish & Simulate" to generate the complete
        project and launch the simulation.
      </p>
      <button onClick={onFinish} className="btn-primary px-8 py-3 text-lg">
        Finish & Simulate
        <ArrowRight className="h-4 w-4 ml-2" />
      </button>
    </div>
  );
}