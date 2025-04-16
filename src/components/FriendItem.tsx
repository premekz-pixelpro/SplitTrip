import { FirebaseUser } from "@/types/types";
import React, { useEffect } from "react";

interface FriendItemProps {
  user: FirebaseUser;
  balance: number;
  isSelected?: boolean;
  onSelect?: (user: FirebaseUser) => void;
}

export const FriendItem: React.FC<FriendItemProps> = ({ 
  user, 
  balance,
  isSelected = false,
  onSelect 
}) => {
  useEffect(() => {
    console.log("FriendItem mounted", user.displayName);
  }, [user.displayName]);
  const { displayName, email, image } = user;

  const getShareColor = (balance: number) => {
    if (balance > 0) return 'green';
    if (balance < 0) return 'red';
    return 'black';
  };

  return (
    <li 
      className={isSelected ? "selected" : ""}
      onClick={() => onSelect?.(user)}
    >
      <img 
        src={image || `https://ui-avatars.com/api/?name=${displayName}`} 
        alt={displayName} 
      />
      <div className="user-info">
        <h3>{displayName}</h3>
        <p>{email}</p>
        <p style={{color: getShareColor(balance) }}>balance: {balance}</p>
      </div>
    </li>
  );
};