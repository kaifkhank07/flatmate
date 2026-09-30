export type SegmentedFilterOption = {
  value: string;
  label: string;
};

export type SegmentedFilterProps = {
  options: SegmentedFilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function SegmentedFilter({
  options,
  value,
  onChange,
  className = "",
}: SegmentedFilterProps) {
  return (
    <div className={`seg ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "on" : ""}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default SegmentedFilter;
