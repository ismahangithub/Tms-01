import { useState } from "react";
import { UpdateUserDialog } from "./UpdateUser";
import { VerifyUserDialog } from "./VerifyUser";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "User" | "Admin";
}

export function EditUserProcess() {
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const handleUserVerification = (user: User | null) => {
    if (user) {
      setUserToEdit(user);
    } else {
      console.warn("No user verified for editing.");
    }
  };

  return (
    <div>
      {/* Verify User */}
      <VerifyUserDialog onUserVerified={handleUserVerification} />

      {/* Update User */}
      {userToEdit ? (
        <UpdateUserDialog user={userToEdit} onUpdateComplete={() => setUserToEdit(null)} />
      ): null}
    </div>
  );
}
