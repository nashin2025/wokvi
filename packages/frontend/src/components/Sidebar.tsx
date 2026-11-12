import { useComponentLibraryStore, useUIStore } from '../store';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Cpu,
  Thermometer,
  Zap,
  Monitor,
  Wifi,
  Battery,
  GitBranch,
  Package,
  X,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { ComponentCategory } from '../types';

const categoryIcons: Record<ComponentCategory, React.ReactNode> = {
  microcontroller: <Cpu className="h-4 w-4" />,
  sensor: <Thermometer className="h-4 w-4" />,
  actuator: <Zap className="h-4 w-4" />,
  display: <Monitor className="h-4 w-4" />,
  communication: <Wifi className="h-4 w-4" />,
  power: <Battery className="h-4 w-4" />,
  passive: <GitBranch className="h-4 w-4" />,
  other: <Package className="h-4 w-4" />,
};

const categoryLabels: Record<ComponentCategory, string> = {
  microcontroller: 'Microcontrollers',
  sensor: 'Sensors',
  actuator: 'Actuators',
  display: 'Displays',
  communication: 'Communication',
  power: 'Power',
  passive: 'Passive',
  other: 'Other',
};

export function Sidebar() {
  const { sidebarOpen } = useUIStore();
  const {
    components,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    getComponents,
  } = useComponentLibraryStore();

  const filteredComponents = getComponents();
  const groupedComponents = filteredComponents.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<ComponentCategory, typeof components>);

  const [expandedCategories, setExpandedCategories] = useUIStore((state) =>
    state.expandedCategories ?? categories.reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
  );

  const toggleCategory = (category: ComponentCategory) => {
    setExpandedCategories((prev: Record<string, boolean>) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-surface-200 dark:border-surface-700">
        <h2 className={cn('font-medium text-surface-900 dark:text-surface-100', sidebarOpen ? 'text-base' : 'hidden')}>
          Components
        </h2>
        {!sidebarOpen && (
          <Microchip className="h-5 w-5 text-surface-600 dark:text-surface-400" />
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-surface-200 dark:border-surface-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder={sidebarOpen ? 'Search components...' : ''}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'input pl-9 h-9 text-sm',
              sidebarOpen ? 'w-full' : 'w-10'
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 hover:text-surface-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div className="p-3 border-b border-surface-200 dark:border-surface-700">
        <div className="flex flex-wrap gap-1">
          {['all', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'all' ? null : cat as ComponentCategory)}
              className={cn(
                'px-2 py-1 rounded-full text-xs font-medium transition-all',
                selectedCategory === (cat === 'all' ? null : cat)
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700'
              )}
            >
              {cat === 'all' ? 'All' : categoryLabels[cat as ComponentCategory]}
            </button>
          ))}
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {Object.entries(groupedComponents).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-surface-500 dark:text-surface-400">
            <Box className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No components found</p>
            <p className="text-xs">Try adjusting your search or filters</p>
          </div>
        ) : (
          Object.entries(groupedComponents).map(([category, comps]) => (
            <div key={category} className="mb-4">
              <button
                onClick={() => toggleCategory(category as ComponentCategory)}
                className={cn(
                  'flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 rounded-lg',
                  sidebarOpen ? '' : 'justify-center'
                )}
              >
                {sidebarOpen && (
                  <>
                    {expandedCategories[category] ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    )}
                  </>
                )}
                {categoryIcons[category as ComponentCategory]}
                {sidebarOpen && (
                  <span className="capitalize">{categoryLabels[category as ComponentCategory]}</span>
                )}
                {sidebarOpen && (
                  <span className="ml-auto text-xs text-surface-400 bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">
                    {comps.length}
                  </span>
                )}
              </button>

              {expandedCategories[category] && sidebarOpen && (
                <div className="mt-1 space-y-1 pl-6">
                  {comps.map((comp) => (
                    <ComponentListItem key={comp.id} component={comp} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ComponentListItem({ component }: { component: import('../types').Component }) {
  const { sidebarOpen } = useUIStore();

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-surface-700 dark:text-surface-300',
        'hover:bg-surface-100 dark:hover:bg-surface-800',
        'cursor-grab active:cursor-grabbing',
        sidebarOpen ? '' : 'justify-center p-2'
      )}
      draggable
      data-component-id={component.id}
      title={sidebarOpen ? `${component.name} - ${component.metadata.description || 'No description'}` : component.name}
    >
      {sidebarOpen && categoryIcons[component.category]}
      {sidebarOpen && <span className="truncate flex-1">{component.name}</span>}
      {!sidebarOpen && component.metadata.manufacturer && (
        <span className="text-xs text-surface-400">{component.metadata.manufacturer}</span>
      )}
    </div>
  );
}