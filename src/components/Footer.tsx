import { Link } from '@tanstack/react-router';
export const Footer = () => {
  return (
    <div className="bottom-nav-bar">
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Info
        </Link>{' '}
        <Link to="/profile" className="[&.active]:font-bold">
          User
        </Link>
        <Link to="/billhistory" className="[&.active]:font-bold">
          BillHistory
        </Link>
      </div>
    </div>
  );
};
