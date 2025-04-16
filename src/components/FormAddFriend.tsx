import React, { useState } from "react";
import { Friend } from "@/types/types";
import { Button } from "@/components";

export const FormAddFriend: React.FC<{ onAddFriend: (newFriend: Friend) => void }> = ({ onAddFriend }) => {
  const [name, setName] = useState("");
  const [image, setImage] = useState("https://i.pravatar.cc/48");

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (!name || !image) {
      alert("uzupelnij pola");
      return;
    }

    const id = crypto.randomUUID(); // Generates a unique string ID

    const newFriend = {
      id,
      name,
      image: `${image}?=${id}`,
      balance: 0,
    };

    onAddFriend(newFriend);
    setName("");
    setImage("https://i.pravatar.cc/48");
  };

  return (
    <form className="form-add-friend" onSubmit={handleSubmit}>
      <label>🧑‍🤝‍🧑Friend name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label>🖼️Friend image</label>
      <input
        type="text"
        value={image}
        onChange={(e) => setImage(e.target.value)}
      />

      <Button type="submit" className="add-button">Add</Button>
    </form>
  );
};