
interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export const GradientText = ({ children, className = "" }: GradientTextProps) => {
  return (
    <span className={`bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
};
