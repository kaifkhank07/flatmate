export type ResetFilterButtonProps = {
  onClick: () => void;
  visible?: boolean;
  className?: string;
};

export function ResetFilterButton({
  onClick,
  visible = true,
  className = "",
}: ResetFilterButtonProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      className={`btn btn-ghost sm ${className}`}
      onClick={onClick}
    >
      Reset
    </button>
  );
}

export default ResetFilterButton;
