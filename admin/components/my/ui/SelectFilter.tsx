export type SelectFilterOption = {
  value: string;
  label: string;
};

export type SelectFilterProps = {
  value: string;
  options: SelectFilterOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
};

export function SelectFilter({
  value,
  options,
  placeholder = "All",
  onChange,
  className = "px-3 py-1.5 bg-[var(--canvas-2)] border border-[var(--hair-2)] rounded-lg text-xs font-semibold text-[var(--ink-2)] focus:outline-none focus:border-[var(--ember)]",
}: SelectFilterProps) {
  return (
    <select
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default SelectFilter;
