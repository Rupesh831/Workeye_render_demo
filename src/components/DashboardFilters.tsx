import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface FilterState {
  searchName: string;
  status: string;
  screenTimeMin: string;
  screenTimeMax: string;
  activeTimeMin: string;
  activeTimeMax: string;
  idleTimeMin: string;
  idleTimeMax: string;
  productivityMin: string;
  productivityMax: string;
  screenshotsMin: string;
  screenshotsMax: string;
}

interface DashboardFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function DashboardFilters({ filters, onFilterChange }: DashboardFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = () => {
    return filters.searchName !== '' || 
           filters.status !== 'all' ||
           filters.screenTimeMin !== '' ||
           filters.screenTimeMax !== '' ||
           filters.activeTimeMin !== '' ||
           filters.activeTimeMax !== '' ||
           filters.idleTimeMin !== '' ||
           filters.idleTimeMax !== '' ||
           filters.productivityMin !== '' ||
           filters.productivityMax !== '' ||
           filters.screenshotsMin !== '' ||
           filters.screenshotsMax !== '';
  };

  const handleReset = () => {
    onFilterChange({
      searchName: '',
      status: 'all',
      screenTimeMin: '',
      screenTimeMax: '',
      activeTimeMin: '',
      activeTimeMax: '',
      idleTimeMin: '',
      idleTimeMax: '',
      productivityMin: '',
      productivityMax: '',
      screenshotsMin: '',
      screenshotsMax: '',
    });
    setShowAdvanced(false);
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm ${
          hasActiveFilters()
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {hasActiveFilters() && (
          <span className="bg-white/30 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            ●
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Filter Panel */}
          <div className="absolute right-0 mt-2 w-[90vw] sm:w-[500px] max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[80vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold">Filter Members</h3>
                    <p className="text-slate-500 text-xs sm:text-sm">Refine your search</p>
                  </div>
                </div>
                
                {hasActiveFilters() && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>

              {/* Basic Filters */}
              <div className="space-y-4 mb-4">
                {/* Search by Name */}
                <div>
                  <label className="block text-slate-700 font-medium mb-2 text-sm">Search Name or Email</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={filters.searchName}
                      onChange={(e) => handleChange('searchName', e.target.value)}
                      placeholder="Type employee name or email..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-slate-700 font-medium mb-2 text-sm">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>

                  {/* Productivity */}
                  <div>
                    <label className="block text-slate-700 font-medium mb-2 text-sm">Min Productivity %</label>
                    <input
                      type="number"
                      value={filters.productivityMin}
                      onChange={(e) => handleChange('productivityMin', e.target.value)}
                      placeholder="e.g. 75"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors mb-4 font-medium text-sm"
              >
                <Filter className="w-4 h-4" />
                <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {/* Advanced Filters */}
              {showAdvanced && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Screen Time */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-2 text-sm">Min Screen Time (hrs)</label>
                      <input
                        type="number"
                        value={filters.screenTimeMin}
                        onChange={(e) => handleChange('screenTimeMin', e.target.value)}
                        placeholder="e.g. 5"
                        step="0.1"
                        min="0"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-2 text-sm">Max Screen Time (hrs)</label>
                      <input
                        type="number"
                        value={filters.screenTimeMax}
                        onChange={(e) => handleChange('screenTimeMax', e.target.value)}
                        placeholder="e.g. 10"
                        step="0.1"
                        min="0"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>

                    {/* Active Time */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-2 text-sm">Min Active Time (hrs)</label>
                      <input
                        type="number"
                        value={filters.activeTimeMin}
                        onChange={(e) => handleChange('activeTimeMin', e.target.value)}
                        placeholder="e.g. 4"
                        step="0.1"
                        min="0"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-2 text-sm">Max Active Time (hrs)</label>
                      <input
                        type="number"
                        value={filters.activeTimeMax}
                        onChange={(e) => handleChange('activeTimeMax', e.target.value)}
                        placeholder="e.g. 9"
                        step="0.1"
                        min="0"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>

                    {/* Screenshots */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-2 text-sm">Min Screenshots</label>
                      <input
                        type="number"
                        value={filters.screenshotsMin}
                        onChange={(e) => handleChange('screenshotsMin', e.target.value)}
                        placeholder="e.g. 1"
                        min="0"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-2 text-sm">Max Screenshots</label>
                      <input
                        type="number"
                        value={filters.screenshotsMax}
                        onChange={(e) => handleChange('screenshotsMax', e.target.value)}
                        placeholder="e.g. 10"
                        min="0"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
