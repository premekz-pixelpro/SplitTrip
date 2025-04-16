export const Button: React.FC<{ children: React.ReactNode; onClick?: () => void; className: string; type?: "button" | "submit" | "reset" }> = ({ children, onClick, className, type = "button" }) => (
    <button className={`button ${className}`} onClick={onClick} type={type}>
      {children}
    </button>
  );