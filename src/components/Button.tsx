export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}> = ({ children, onClick, className, type = 'button', disabled = false }) => (
  <button className={`button ${className}`} onClick={onClick} type={type} disabled={disabled}>
    {children}
  </button>
);
