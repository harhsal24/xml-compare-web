/**
 * DiffLegend Component
 * Legend explaining the diff color codes
 */

export default function DiffLegend() {
    const items = [
        { color: 'bg-green-500', label: 'Matched', description: 'Element exists in both files' },
        { color: 'bg-amber-500', label: 'Extra', description: 'Element only in this file' },
        { color: 'bg-purple-500', label: 'Different', description: 'Content or attributes differ' },
    ];

    return (
        <div className="flex flex-wrap items-center justify-center gap-6 py-3 px-6 bg-slate-100 rounded-xl">
            {items.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full ${item.color}`}></span>
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span className="text-xs text-slate-500 hidden sm:inline">({item.description})</span>
                </div>
            ))}
        </div>
    );
}
